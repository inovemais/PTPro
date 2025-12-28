# Como Gerar uma JWT Secret Key

## 🔐 Métodos para Gerar Chaves Secretas

### Método 1: OpenSSL (Recomendado - Base64)
```bash
openssl rand -base64 32
```
**Exemplo de saída:** `zUHwQEwQUvZNvz7Mu4FZNH8wmdnr3hcXgp03P6oxLNI=`

### Método 2: OpenSSL (Hexadecimal)
```bash
openssl rand -hex 32
```
**Exemplo de saída:** `75c95fe3c075856d2f1ab2c15313665ab61a1709543be559fedb13fe36efcf13`

### Método 3: Node.js (crypto)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
**Exemplo de saída:** `nO05ln+F3iA98hm6265wpbyOU0GYLYEv6xy8tf24xyQ=`

### Método 4: Python
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Método 5: Online (Geradores Web)
- **RandomKeygen:** https://randomkeygen.com/
- **Random.org:** https://www.random.org/strings/
- **1Password Secret Key Generator:** https://1password.com/password-generator/

## 📋 Requisitos para uma Boa Chave Secreta

✅ **Comprimento:** Mínimo de 32 caracteres (recomendado 64+)  
✅ **Aleatoriedade:** Deve ser completamente aleatória  
✅ **Complexidade:** Misture letras, números e símbolos  
✅ **Segurança:** Nunca use palavras comuns ou padrões previsíveis

## 🎯 Chaves Geradas Agora

Aqui estão algumas chaves geradas para você escolher:

1. **Base64:** `zUHwQEwQUvZNvz7Mu4FZNH8wmdnr3hcXgp03P6oxLNI=`
2. **Hexadecimal:** `75c95fe3c075856d2f1ab2c15313665ab61a1709543be559fedb13fe36efcf13`
3. **Base64 (Node.js):** `nO05ln+F3iA98hm6265wpbyOU0GYLYEv6xy8tf24xyQ=`

## 📝 Como Usar a Chave

### 1. No Render (Produção)
1. Acesse: https://dashboard.render.com
2. Vá em **Environment**
3. Adicione/Atualize a variável:
   - **Key:** `SECRET`
   - **Value:** `[cole a chave gerada aqui]`
4. Salve as alterações

### 2. Localmente (Desenvolvimento)
1. Edite o arquivo `Backend/.env`:
   ```
   SECRET=sua-chave-gerada-aqui
   ```
2. **NUNCA** commite o arquivo `.env` no Git!

## ⚠️ Boas Práticas de Segurança

1. **Nunca commite chaves no Git**
   - Use `.gitignore` para proteger arquivos `.env`
   - Use variáveis de ambiente no servidor

2. **Use chaves diferentes para cada ambiente**
   - Desenvolvimento: chave local
   - Produção: chave no Render
   - Teste: chave separada

3. **Rotacione chaves periodicamente**
   - Mude a chave a cada 6-12 meses
   - Quando mudar, invalide tokens antigos

4. **Mantenha chaves seguras**
   - Não compartilhe chaves em mensagens
   - Use gerenciadores de senhas para armazenar

## 🔄 Como Rotacionar uma Chave

Se precisar mudar a chave em produção:

1. Gere uma nova chave usando um dos métodos acima
2. Atualize no Render (Environment → SECRET)
3. Faça um novo deploy
4. **Importante:** Todos os tokens JWT antigos serão invalidados
5. Usuários precisarão fazer login novamente

## 🧪 Testar se a Chave Funciona

Após configurar, teste fazendo login:
- Se funcionar: ✅ Chave está correta
- Se der erro de autenticação: ❌ Verifique se a chave está correta no Render

## 📚 Referências

- [JWT.io](https://jwt.io/) - Documentação sobre JWT
- [OWASP JWT Security](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html) - Boas práticas de segurança

