#!/bin/bash
# Script para configurar o repositório GitHub

# Adicionar remote
git remote add origin https://github.com/gmasilva10/AgenciaF3F.git

# Verificar remote
git remote -v

# Fazer push do branch main
git push -u origin main
