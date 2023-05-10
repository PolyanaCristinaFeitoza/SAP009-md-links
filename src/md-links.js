import { readFile, lstatSync } from 'node:fs';

export const isDirectory = (path) => lstatSync(path).isDirectory();
export const isFile = (path) => lstatSync(path).isFile();

export const extrairInformacoes = (string, arquivo) => {
  if (!string && !arquivo) throw new Error('dados inválidos');
  const informacoes = string.split('](');
  const texto = informacoes[0].replace('[', '');
  const link = informacoes[1].replace(')', '');
  return {
    arquivo,
    link,
    texto,
  };
};

export const mdLinks = (caminhoDoArquivo, options) => {
  if (!caminhoDoArquivo) throw new Error('parâmetro inválido');
  // Verifica se o caminho se refere a um diretório
  if (isDirectory(caminhoDoArquivo)) {
    // Lê todos os arquivos do diretório
    const arquivos = readdirSync(caminhoDoArquivo);
    const arquivosMarkdown = arquivos.filter((arquivo) => path.extname(arquivo) === '.md');
    const promises = arquivosMarkdown.map((arquivo) => {
      const caminhoCompleto = path.join(caminhoDoArquivo, arquivo);
      return mdLinks(caminhoCompleto, options);
    });
    return Promise.all(promises).then((resultados) => [].concat(...resultados));
  }

  // Verifica se o caminho se refere a um arquivo
  if (isFile(caminhoDoArquivo)) {
    //endsWith é um método de string em JavaScript que verifica se uma string termina com um determinado sufixo especificado. 
    if (!caminhoDoArquivo.endsWith('.md')) {
      console.error('O caminho especificado não se refere a um arquivo Markdown');}
    return new Promise((resolve, reject) => {
      const encode = 'utf-8';
      const regex = /\[[^\]]+\]\(([^)]+)\)/gm;
      readFile(caminhoDoArquivo, encode, (err, data) => {
        if (err) throw reject(err);
        const conteudo = data.match(regex);
        const informacoes = conteudo.map((item) => extrairInformacoes(item, caminhoDoArquivo));
        if (options.validate) {
          Promise.all(informacoes.map((item) => fetch(item.link)
            .then((res) => {
              item.status = res.status;
              if (res.status !== 200) {
                item.message = 'FAIL';
              } else {
                item.message = res.statusText;
              }
              return item;
            })
            .catch((error) => {
              item.status = error;
              item.message = 'Esse link não existe';
              return item;
            })))
            .then(resolve);
        } else {
          resolve(informacoes);
        }
      });
    });
  }
};

