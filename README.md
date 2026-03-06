# Inicializa el repositorio local (si no lo has hecho)
git init

# Agrega todos los archivos al área de staging
git add .

# Crea el primer commit
git commit -m "Primer commit"

# Renombra la rama principal a 'main' (si es necesario)
git branch -M main

# Agrega el repositorio remoto (reemplaza con tu URL exacta)
git remote add origin https://github.com/MINmetal/CrushFlowProject.git

# Sube los cambios a GitHub
git push -u origin main
