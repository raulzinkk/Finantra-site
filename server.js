import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente de .env ou .env.local
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// A porta padrão para servidores web é 80, mas permitimos configurar qualquer porta via ambiente.
// Dica: No Windows, a porta 80 pode necessitar de permissão de administrador ou estar em uso pelo IIS.
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos da pasta compilada (dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Tratar todas as rotas direcionando para o index.html (suporte para roteamento de SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('==================================================');
  console.log('         FINANTRA - SERVIDOR DE PRODUÇÃO          ');
  console.log('==================================================');
  console.log(` Servidor rodando com sucesso!`);
  console.log(` Acesso Local: http://localhost:${PORT}`);
  console.log(` Acesso na Rede: http://<SEU_IP_LOCAL>:${PORT}`);
  console.log('==================================================');
});
