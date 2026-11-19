"""Meu Ciclo+ — modelagem acadêmica de notificações agregadas. Autor responsável: Lucca.
Executar somente com a base pública tratada da EDA; não usa dados de usuárias.
"""
from pathlib import Path
import hashlib
import json
import platform
import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.base import clone
from sklearn.cluster import KMeans
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, balanced_accuracy_score, silhouette_score, davies_bouldin_score,
    adjusted_rand_score)
from threadpoolctl import threadpool_limits

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'dados/tratados/sinan_feminino_uf_2015_2024.csv'
SAIDAS = ROOT / 'saidas'
ARTEFATOS = ROOT / 'modelo'
SEED = 42
ANOS = list(range(2015, 2025))
FEATURES = ['ultimo_log_crescimento', 'media_log_crescimento_2a', 'desvio_log_crescimento_2a']
CLUSTER_FEATURES = ['media_log_crescimento', 'desvio_log_crescimento', 'fracao_anos_sem_aumento']
AVISO = ('Estimativa acadêmica a partir de notificações agregadas do SINAN. '
         'Não mede incidência, vítimas únicas, risco individual ou segurança de uma UF; '
         'não substitui avaliação profissional, policial ou jurídica. '
         'Não usar para decisões de atendimento.')


def carregar(path=DATA):
    df = pd.read_csv(path, sep=';', encoding='utf-8-sig')
    if list(df.columns) != ['uf', 'ano', 'frequencia'] or df.isna().any().any():
        raise ValueError('Colunas inesperadas ou nulos na base.')
    if (len(df) != 270 or df.uf.nunique() != 27 or sorted(df.ano.unique()) != ANOS
            or df.duplicated(['uf', 'ano']).any() or not df.frequencia.gt(0).all()
            or not df.frequencia.mod(1).eq(0).all()
            or not df.groupby('uf').ano.nunique().eq(10).all()):
        raise ValueError('Base fora do recorte ou inválida; revisar EDA.')
    return df.sort_values(['uf', 'ano']).reset_index(drop=True)


def metadados():
    return {'fonte': 'SINAN/DATASUS — violência interpessoal e autoprovocada; sexo feminino; todas as idades; UF de notificação',
            'periodo': [2015, 2024], 'sha256_csv': hashlib.sha256(DATA.read_bytes()).hexdigest(),
            'python': platform.python_version(), 'sklearn': sklearn.__version__, 'pandas': pd.__version__,
            'numpy': np.__version__, 'random_state': SEED, 'aviso': AVISO}


def atributos_classificacao(df):
    """Cada linha usa apenas t,t-1,t-2; o alvo observado é de t+1."""
    d = df.sort_values(['uf','ano']).copy()
    grupos = d.groupby('uf', sort=False)
    anterior = grupos.frequencia.shift(1)
    anterior2 = grupos.frequencia.shift(2)
    proximo = grupos.frequencia.shift(-1)
    g1 = np.log(d.frequencia / anterior)
    g2 = np.log(anterior / anterior2)
    d[FEATURES[0]] = g1
    d[FEATURES[1]] = (g1 + g2) / 2
    d[FEATURES[2]] = abs(g1 - g2) / 2
    d['ano_alvo'] = d.ano + 1
    d['aumento'] = (proximo > d.frequencia).astype(int)
    # O último ano não possui alvo observado; jamais tratá-lo como classe 0.
    return d.loc[anterior2.notna() & proximo.notna(), ['uf','ano','ano_alvo',*FEATURES,'aumento']].reset_index(drop=True)


def modelos():
    return {
        'logistica': make_pipeline(StandardScaler(), LogisticRegression(class_weight='balanced', random_state=SEED, max_iter=2000)),
        'arvore': DecisionTreeClassifier(max_depth=3, min_samples_leaf=8, class_weight='balanced', random_state=SEED),
        'random_forest': RandomForestClassifier(n_estimators=200, max_depth=4, min_samples_leaf=5, class_weight='balanced', random_state=SEED, n_jobs=1),
        'maioria': DummyClassifier(strategy='most_frequent'),
    }


def metricas(y, pred):
    y, pred = np.asarray(y), np.asarray(pred)
    return {'n': int(len(y)), 'suporte': [int((y==i).sum()) for i in [0,1]],
            'acuracia': float(accuracy_score(y,pred)),
            'precisao_macro': float(precision_score(y,pred,labels=[0,1],average='macro',zero_division=0)),
            'recall_macro': float(recall_score(y,pred,labels=[0,1],average='macro',zero_division=0)),
            'f1_macro': float(f1_score(y,pred,labels=[0,1],average='macro',zero_division=0)),
            'f1_por_classe': f1_score(y,pred,labels=[0,1],average=None,zero_division=0).tolist(),
            'balanceada': float(balanced_accuracy_score(y,pred)) if len(np.unique(y))==2 else None,
            'matriz_confusao': confusion_matrix(y,pred,labels=[0,1]).tolist()}


def prever(nome, train, test):
    if nome=='persistencia':
        return (test[FEATURES[0]] > 0).astype(int).to_numpy(), None
    m = clone(modelos()[nome]).fit(train[FEATURES],train.aumento)
    return m.predict(test[FEATURES]), m


def classificar(df):
    dados = atributos_classificacao(df)
    dev = dados[dados.ano_alvo < 2024]
    teste = dados[dados.ano_alvo == 2024]
    nomes = [*modelos(), 'persistencia']
    cvs, folds = {}, []
    # Expansão por ANO-ALVO: todas as UFs de cada ano permanecem juntas.
    for nome in nomes:
        ys, preds = [], []
        for ano in [2020,2021,2022,2023]:
            treino = dev[dev.ano_alvo < ano]; valid = dev[dev.ano_alvo == ano]
            p, _ = prever(nome, treino, valid)
            ys.extend(valid.aumento); preds.extend(p)
            folds.append({'modelo':nome,'ano_alvo':ano,**metricas(valid.aumento,p)})
        cvs[nome]=metricas(ys,preds)
    candidatos = ['logistica','arvore','random_forest']
    melhor=max(candidatos,key=lambda n:cvs[n]['f1_macro'])
    aval, predicoes, escolhido = {}, {}, None
    # Avaliar apenas o candidato selecionado por CV e as duas referências em 2024.
    for nome in [melhor,'maioria','persistencia']:
        p,m = prever(nome,dev,teste)
        aval[nome]=metricas(teste.aumento,p)
        predicoes[nome]=p
        if nome==melhor: escolhido=m
    refs=['maioria','persistencia']
    # Critério conservador educacional, não clínico. Mesmo aprovado, sem previsão no app.
    passou = (cvs[melhor]['f1_macro'] > max(cvs[n]['f1_macro'] for n in refs)
              and aval[melhor]['f1_macro'] > max(aval[n]['f1_macro'] for n in refs)
              and aval[melhor]['balanceada'] is not None and aval[melhor]['balanceada'] >= .60)
    resultado = {'metadados':metadados(), 'alvo':'1 = aumento das notificações em t+1; 0 = sem aumento',
        'atributos':FEATURES,'anos_alvo_desenvolvimento':[2018,2019,2020,2021,2022,2023],
        'anos_alvo_validacao':[2020,2021,2022,2023], 'ano_alvo_teste':2024,
        'n_desenvolvimento':len(dev),'n_teste':len(teste),'candidato':melhor,
        'criterio_selecao':'F1 macro agrupado das previsões fora da amostra em CV temporal',
        'cv':cvs,'dobras':folds,'teste_reservado':aval,
        'criterio_exploratorio':'Superar ambas as referências em F1 macro CV e teste; acurácia balanceada teste >= 0,60',
        'criterio_atendido':bool(passou),'uso':'somente análise acadêmica retrospectiva; não publicar projeção'}
    previsoes = teste[['uf','ano_alvo','aumento']].copy()
    for nome,p in predicoes.items(): previsoes[nome]=p
    return resultado, escolhido, previsoes


def atributos_cluster(df, ate=2024):
    wide=df[df.ano<=ate].pivot(index='uf',columns='ano',values='frequencia')
    cres=np.log(wide).diff(axis=1).iloc[:,1:]
    return pd.DataFrame({CLUSTER_FEATURES[0]:cres.mean(axis=1),
                         CLUSTER_FEATURES[1]:cres.std(axis=1,ddof=0),
                         CLUSTER_FEATURES[2]:cres.le(0).mean(axis=1)})


def kmeans(k, seed=SEED):
    return make_pipeline(StandardScaler(), KMeans(n_clusters=k, n_init=30, random_state=seed))


def agrupar(df):
    x=atributos_cluster(df)
    avaliacao=[]; ajustados={}
    with threadpool_limits(limits=1):
        for k in range(2,7):
            p=kmeans(k).fit(x); labels=p.predict(x); z=p[0].transform(x)
            tamanhos=np.bincount(labels,minlength=k)
            if len(np.unique(labels))<2: continue
            avaliacao.append({'k':k,'silhouette':float(silhouette_score(z,labels)),
                'davies_bouldin':float(davies_bouldin_score(z,labels)),
                'inercia':float(p[1].inertia_), 'menor_grupo':int(tamanhos.min())})
            ajustados[k]=p
        elegiveis=[a for a in avaliacao if a['menor_grupo']>=3]
        if not elegiveis: raise ValueError('Nenhum k com ao menos 3 UFs em cada grupo.')
        escolhido=max(elegiveis,key=lambda a:a['silhouette']); k=escolhido['k']; p=ajustados[k]
        labels=p.predict(x); rng=np.random.default_rng(SEED); aris=[]
        # Estabilidade, não CV supervisionada: refit do scaler e KMeans em 80% das UFs.
        for i in range(50):
            idx=rng.choice(len(x),size=int(.8*len(x)),replace=False)
            outro=kmeans(k,SEED+i+1).fit(x.iloc[idx]); aris.append(adjusted_rand_score(labels,outro.predict(x)))
        x_anterior=atributos_cluster(df,2023)
        anterior=kmeans(k).fit(x_anterior)
        ari_temporal=adjusted_rand_score(labels,anterior.predict(x_anterior))
    grupos=x.copy(); grupos['grupo']=labels+1
    perfis=[]
    for grupo,g in grupos.groupby('grupo'):
        perfis.append({'grupo':int(grupo),'quantidade_ufs':len(g),'ufs':g.index.tolist(),
                       'crescimento_geometrico_medio_pct':float(100*np.expm1(g[CLUSTER_FEATURES[0]].mean())),
                       'desvio_log_crescimento_medio':float(g[CLUSTER_FEATURES[1]].mean()),
                       'fracao_media_anos_sem_aumento':float(g[CLUSTER_FEATURES[2]].mean())})
    resultado={'metadados':metadados(),'unidade':'UF; 27 observações, cada uma agrega 10 anos',
        'atributos':CLUSTER_FEATURES, 'criterio':'Maior silhouette entre k=2..6 com no mínimo 3 UFs por grupo',
        'k':k,'avaliacao':avaliacao,'selecionado':escolhido,
        'estabilidade':{'metodo':'50 subamostras de 80%; ARI sobre as 27 UFs', 'ari_medio':float(np.mean(aris)),
            'ari_mediano':float(np.median(aris)), 'ari_p10':float(np.quantile(aris,.1)),
            'ari_2015_2023_vs_2015_2024':float(ari_temporal)},
        'perfis':perfis,'uso':'agrupamentos descritivos históricos, rótulos arbitrários; sem ranking de risco'}
    return resultado,p,grupos.reset_index()


def salvar_json(path,obj):
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')


def executar_classificacao():
    SAIDAS.mkdir(exist_ok=True)
    r,m,p=classificar(carregar())
    salvar_json(SAIDAS/'metricas_classificacao.json',r)
    p.to_csv(SAIDAS/'avaliacao_classificacao_2024.csv',index=False,encoding='utf-8')
    joblib.dump(m,ARTEFATOS/'classificacao.joblib')
    return r,p


def executar_clusterizacao():
    SAIDAS.mkdir(exist_ok=True)
    df=carregar(); r,m,g=agrupar(df)
    salvar_json(SAIDAS/'metricas_clusterizacao.json',r)
    g.to_csv(SAIDAS/'clusters_uf.csv',index=False,encoding='utf-8')
    joblib.dump(m,ARTEFATOS/'clusterizacao.joblib')
    # Contrato descritivo para futura API: não contém projeções ou relatos individuais.
    indicador={'versao_esquema':'1.0','id':'perfil_historico_notificacoes_sinan',
        'titulo':'Padrões históricos de notificações por UF','fonte':r['metadados']['fonte'],
        'periodo':[2015,2024],'n_ufs':27,'n_registros':270,
        'total_notificacoes':int(df.frequencia.sum()),'k':r['k'],
        'silhouette':r['selecionado']['silhouette'],'ari_medio':r['estabilidade']['ari_medio'],
        'ari_p10':r['estabilidade']['ari_p10'],'ari_temporal':r['estabilidade']['ari_2015_2023_vs_2015_2024'],
        'status_validacao':'exploratorio; estabilidade limitada; não operacional',
        'grupos':r['perfis'],'aviso':AVISO,'uso':'descritivo retrospectivo e acadêmico; não é risco ou previsão',
        'limitacoes':['Contagens absolutas não equivalem a taxas populacionais.',
                       'Cobertura, subnotificação e mudanças no registro podem influenciar os padrões.',
                       'Amostra pequena; agrupamentos exploratórios e sensíveis à escolha dos atributos.',
                       'Fonte conferida com os arquivos fornecidos; nova consulta ao portal e licença específica pendentes.']}
    salvar_json(SAIDAS/'indicador_agregado.json',indicador)
    return r,g


if __name__=='__main__':
    c,_=executar_classificacao(); k,_=executar_clusterizacao()
    print('Classificação:',c['candidato'],'CV F1 macro:',round(c['cv'][c['candidato']]['f1_macro'],4),
          'teste F1 macro:',round(c['teste_reservado'][c['candidato']]['f1_macro'],4),'critério:',c['criterio_atendido'])
    print('Clusterização: k=',k['k'],'silhouette=',round(k['selecionado']['silhouette'],4),'ARI médio=',round(k['estabilidade']['ari_medio'],4))
