#!/bin/bash

# --- CONFIGURAÇÃO ---
# Se o nome do teu branch principal não for 'main', muda aqui:
BRANCH_NAME="main"
BACKUP_MESSAGE="BACKUP: $(date +%Y-%m-%d) - Rotina de Backup Rápido."

echo "=========================================="
echo "🚀 INICIANDO BACKUP SEGURO E LIMPEZA DE CACHE"
echo "=========================================="

# 1. Limpeza de Ficheiros Temporários e Cache
echo "1. Limpando caches e ficheiros de log..."
rm -rf node_modules dist build
rm -f npm-debug.log vendure.sqlite *.log *.txt *.bak *.swp

# Ficheiros grandes de importação (Ajusta se tiveres outros)
echo "   Excluindo ficheiros JSON e ZIP grandes..."
rm -f importers/omp/*.json importers/omp/*.zip importers/omp/*.xlsx

# 2. Re-indexar Ficheiros e Limpar Stage
echo "2. Re-indexando o repositório..."
# Remove todos os ficheiros eliminados do stage e adiciona os novos
git add .
git rm $(git ls-files --deleted) 

# Verifica se existem alterações de código para commitar
if git diff --cached --quiet; then
    echo "✅ Não há alterações de código para commitar. Push do estado atual."
else
    # 3. Commit das Alterações
    echo "3. Criando novo commit..."
    git commit -m "$BACKUP_MESSAGE"
fi

# 4. Push Final
echo "4. Fazendo push para o branch $BRANCH_NAME..."
# Usa o --force se tiveres reescrito o histórico (para evitar conflitos de cache)
git push origin "$BRANCH_NAME"

echo "=========================================="
if [ $? -eq 0 ]; then
    echo "✅ BACKUP CONCLUÍDO COM SUCESSO. Code está no GitHub."
else
    echo "❌ AVISO: O PUSH FALHOU. Verifique as credenciais ou a conexão SSH."
fi
echo "=========================================="
