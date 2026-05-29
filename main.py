from Backend.lectura import leer_csv
from Backend.limpieza import limpiar_datos
from Backend.analisis import analizar_datos
from Backend.exportar import exportar_csv

# Ruta archivo
ruta = "Data/alquimia_literaria.csv"

# Leer CSV
df = leer_csv(ruta)

# Limpiar datos
df = limpiar_datos(df)

# Analizar
resultado = analizar_datos(df)

# Exportar
exportar_csv(df, "output/alquimia_literaria_limpia.csv")

print(resultado)


