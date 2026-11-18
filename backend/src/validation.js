import { z } from 'zod';

const text = (max = 200) => z.string().trim().max(max);
const optionalText = (max = 200) => text(max).default('');

export const idSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);

    return (
      value.slice(0, 4) !== '0000' &&
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, 'Data inexistente; use AAAA-MM-DD.');

const phone = text(30)
  .transform((value) => value.replace(/[\s()+-]/g, ''))
  .pipe(z.string().regex(/^\d{10,11}$/, 'Informe 10 ou 11 dígitos com DDD.'));

export const profileSchema = z
  .object({
    nome: optionalText(100),
    telefone_emergencia: phone,
    modo_disfarce: z.boolean().default(true),
    notificacoes: z.boolean().default(false),
    tema: z.enum(['Claro', 'Escuro']).default('Claro'),
  })
  .strict();

export const credentialsSchema = z
  .object({
    usuario: text(60)
      .min(3)
      .regex(/^[a-zA-Z0-9._-]+$/)
      .transform((value) => value.toLowerCase()),
    senha: z.string().min(12).max(128),
  })
  .strict();

export const createProfileSchema = profileSchema
  .extend(credentialsSchema.shape)
  .strict();

export const resources = {
  ciclos: {
    table: 'ciclos',
    id: 'id_ciclo',
    booleans: [],
    schema: z
      .object({
        id_perfil: z.number().int().positive(),
        data_inicio: date,
        data_fim: date,
        fluxo: z.enum(['Leve', 'Moderado', 'Intenso']),
        humor: optionalText(),
        sintomas: optionalText(500),
        observacoes: optionalText(1000),
      })
      .strict()
      .refine(
        (data) => data.data_fim >= data.data_inicio,
        'Fim anterior ao início.'
      ),
  },
  contatos: {
    table: 'contatos',
    id: 'id_contato',
    booleans: ['alerta_automatico'],
    schema: z
      .object({
        id_perfil: z.number().int().positive(),
        nome: text(100).min(1),
        telefone: phone,
        relacionamento: text(100).min(1),
        alerta_automatico: z.boolean().default(false),
        observacoes: optionalText(1000),
      })
      .strict(),
  },
  ocorrencias: {
    table: 'ocorrencias',
    id: 'id_ocorrencia',
    booleans: ['acionou_policia'],
    schema: z
      .object({
        id_perfil: z.number().int().positive(),
        data_ocorrencia: date,
        tipo_ocorrencia: text(100).min(1),
        descricao_relato: text(5000).min(1),
        como_se_sentiu: optionalText(200),
        nivel_perigo: z
          .enum(['Não informado', 'Baixo', 'Médio', 'Alto'])
          .default('Não informado'),
        acionou_policia: z.boolean().default(false),
      })
      .strict(),
  },
};
