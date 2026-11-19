import sys
import unittest
from pathlib import Path
import numpy as np
import pandas as pd
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'modelo'))
import ml_sinan as ml

class TestML(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.df=ml.carregar()
        cls.c,cls.m,cls.p=ml.classificar(cls.df)
        cls.k,cls.km,cls.g=ml.agrupar(cls.df)
    def test_base(self):
        self.assertEqual(self.df.shape,(270,3))
        self.assertEqual(int(self.df.frequencia.sum()),2775742)
    def test_alvos(self):
        d=ml.atributos_classificacao(self.df)
        self.assertEqual(len(d),189)
        self.assertTrue(d.ano_alvo.eq(d.ano+1).all())
        self.assertEqual(sorted(d.ano_alvo.unique()),list(range(2018,2025)))
        self.assertTrue(d.groupby('ano_alvo').size().eq(27).all())
    def test_sem_vazamento(self):
        d=ml.atributos_classificacao(self.df)
        alterada=self.df.copy(); alterada.loc[alterada.ano==2024,'frequencia']*=10
        e=ml.atributos_classificacao(alterada)
        pd.testing.assert_frame_equal(d[ml.FEATURES],e[ml.FEATURES])
        pd.testing.assert_series_equal(d.loc[d.ano_alvo<2024,'aumento'],e.loc[e.ano_alvo<2024,'aumento'])
        self.assertTrue((d.loc[d.ano_alvo==2024,'aumento']!=e.loc[e.ano_alvo==2024,'aumento']).any())
    def test_cv_e_teste(self):
        self.assertEqual(self.c['n_desenvolvimento'],162)
        self.assertEqual(self.c['n_teste'],27)
        self.assertEqual(self.c['cv'][self.c['candidato']]['n'],108)
        self.assertEqual(sum(map(sum,self.c['teste_reservado'][self.c['candidato']]['matriz_confusao'])),27)
        self.assertEqual(len(self.p),27)
    def test_clusters(self):
        self.assertEqual(len(self.g),27)
        self.assertTrue(self.g.groupby('grupo').size().ge(3).all())
        self.assertEqual(self.g.grupo.nunique(),self.k['k'])
        self.assertTrue(-1<=self.k['estabilidade']['ari_medio']<=1)
        np.testing.assert_array_equal(self.km.predict(self.g[ml.CLUSTER_FEATURES])+1,self.g.grupo)
    def test_metricas_classe_unica(self):
        x=ml.metricas([1,1],[1,0]);self.assertIsNone(x['balanceada'])
        self.assertEqual(x['matriz_confusao'],[[0,0],[1,1]])

if __name__=='__main__': unittest.main()
