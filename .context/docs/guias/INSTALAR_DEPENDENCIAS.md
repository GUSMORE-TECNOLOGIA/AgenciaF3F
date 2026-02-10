# Instalar Dependências do Projeto

## Problema
O comando `npm run dev` está falhando porque o `vite` não é reconhecido. Isso significa que as dependências não foram instaladas.

## Solução

Execute no terminal (PowerShell):

```powershell
cd C:\Projetos\AgenciaF3F
npm install
```

Isso irá instalar todas as dependências listadas no `package.json`, incluindo:
- Vite (servidor de desenvolvimento)
- React e React DOM
- TypeScript
- Tailwind CSS
- Supabase Client
- E todas as outras dependências

## Após a instalação

Quando o `npm install` terminar, você poderá executar:

```powershell
npm run dev
```

Isso iniciará o servidor de desenvolvimento Vite na porta padrão (geralmente http://localhost:5173).

## Verificar instalação

Para verificar se tudo foi instalado corretamente:

```powershell
# Verificar se node_modules existe
Test-Path node_modules

# Verificar se vite foi instalado
Test-Path node_modules\vite
```

## Troubleshooting

Se o `npm install` falhar:

1. **Verificar Node.js instalado**:
   ```powershell
   node --version
   npm --version
   ```

2. **Limpar cache do npm**:
   ```powershell
   npm cache clean --force
   ```

3. **Deletar node_modules e package-lock.json (se existir)**:
   ```powershell
   Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
   Remove-Item package-lock.json -ErrorAction SilentlyContinue
   ```

4. **Reinstalar**:
   ```powershell
   npm install
   ```
