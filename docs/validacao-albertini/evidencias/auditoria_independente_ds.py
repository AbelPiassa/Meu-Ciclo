import json, re, numpy as np, pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score, accuracy_score, balanced_accuracy_score, confusion_matrix, silhouette_score
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
R='../../../data-science/'
# --- 1. Dados: nacional bruto (Latin-1) x simplificado x UF tratado
raw=open(R+'dados/brutos/sinannet_cnv_violebr211340177_76_178_23.csv',encoding='latin-1').read()
nac_raw={int(a):int(b) for a,b in re.findall(r'"(\d{4})";(\d+)',raw)}
simp=pd.read_csv(R+'dados/brutos/sinan_feminino_2015_2024.csv',sep=';').set_index('ano').frequencia.to_dict()
uf=pd.read_csv(R+'dados/tratados/sinan_feminino_uf_2015_2024.csv',sep=';')
print('raw==simplificado:',nac_raw==simp, '| total',sum(nac_raw.values()))
soma=uf.groupby('ano').frequencia.sum().to_dict()
print('soma UF==nacional por ano:',soma==nac_raw,'| total UF',uf.frequencia.sum(),'| shape',uf.shape,'| ufs',uf.uf.nunique(),'| dup',uf.duplicated(['uf','ano']).sum(),'| nulos',uf.isna().sum().sum())
# UF tratado x txt TabNet (cópia textual)
txt=open(R+'dados/brutos/sinan_feminino_uf_2015_2024_tabnet.txt',encoding='utf-8',errors='replace').read()
print('--- txt tabnet (primeiras linhas):'); print('\n'.join(txt.splitlines()[:8]))
# --- 2. Reimplementação independente da classificação
d=uf.sort_values(['uf','ano']).copy(); rows=[]
for u,g in d.groupby('uf'):
    f=g.set_index('ano').frequencia
    for t in range(2017,2024):
        g1=np.log(f[t]/f[t-1]); g2=np.log(f[t-1]/f[t-2])
        rows.append(dict(uf=u,ano_alvo=t+1,x1=g1,x2=(g1+g2)/2,x3=abs(g1-g2)/2,y=int(f[t+1]>f[t])))
D=pd.DataFrame(rows); print('n obs',len(D),'| teste 2024:',(D.ano_alvo==2024).sum(), '| balanço teste',D[D.ano_alvo==2024].y.value_counts().to_dict())
X=['x1','x2','x3']; dev=D[D.ano_alvo<2024]; te=D[D.ano_alvo==2024]
rf=lambda:RandomForestClassifier(n_estimators=200,max_depth=4,min_samples_leaf=5,class_weight='balanced',random_state=42,n_jobs=1)
ys=[];ps=[]
for a in [2020,2021,2022,2023]:
    m=rf().fit(dev[dev.ano_alvo<a][X],dev[dev.ano_alvo<a].y); v=dev[dev.ano_alvo==a]; ys+=list(v.y); ps+=list(m.predict(v[X]))
print('CV F1 macro RF (indep):',round(f1_score(ys,ps,average='macro',labels=[0,1],zero_division=0),4))
m=rf().fit(dev[X],dev.y); p=m.predict(te[X])
print('Teste 2024 RF (indep): acc',round(accuracy_score(te.y,p),4),'F1m',round(f1_score(te.y,p,average='macro'),4),'balAcc',round(balanced_accuracy_score(te.y,p),4),'CM',confusion_matrix(te.y,p,labels=[0,1]).tolist())
print('Baseline maioria teste: acc',round((te.y==1).mean(),4))
# --- 3. Clusterização independente
W=uf.pivot(index='uf',columns='ano',values='frequencia'); G=np.log(W).diff(axis=1).iloc[:,1:]
F=pd.DataFrame({'m':G.mean(axis=1),'s':G.std(axis=1,ddof=0),'z':G.le(0).mean(axis=1)}); Z=StandardScaler().fit_transform(F)
for k in range(2,7):
    km=KMeans(k,n_init=30,random_state=42).fit(Z); print('k',k,'sil',round(silhouette_score(Z,km.labels_),4),'tamanhos',np.bincount(km.labels_).tolist())
