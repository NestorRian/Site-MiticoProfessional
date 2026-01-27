# dados

## Estrutura
- index.html: pagina unica com header, slider, sobre, busca, grid de produtos, carrinho e footer.
- style.css: estilos globais e responsividade por media queries.
- script.js: slider automatico, menu mobile, carrinho, busca e notificacao.
- assets/: imagens do site (varias bem grandes).

## Observacoes tecnicas
- O HTML usa meta charset UTF-8, mas varios textos aparecem com caracteres corrompidos; vale revisar o encoding dos arquivos.
- O carrinho e todo o catalogo estao no front-end, sem persistencia em servidor.

## Performance
- As imagens em assets sao o maior peso do site (algumas passam de varios MB).
- Recomendo reduzir resolucao, comprimir (JPEG/WebP) e usar lazy loading.
- Priorize imagens acima da dobra e deixe o restante carregar sob demanda.

## Admin
- O projeto atual e estatico. Para login de admin e edicao de produtos/imagens/precos e necessario um backend ou CMS.
- Opcoes comuns: Firebase/Supabase (auth + storage + banco) ou um CMS headless (ex.: Decap/Netlify CMS).
- Um painel totalmente estatico pode existir, mas nao e seguro nem persistente para outros usuarios.

## Proximos passos
- Definir hospedagem e stack do backend/CMS.
- Definir onde ficam os dados dos produtos (DB ou arquivo).
- Definir fluxo de login e permissoes.
