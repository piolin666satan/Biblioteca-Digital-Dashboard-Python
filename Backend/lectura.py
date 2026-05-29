import pandas as pd

def leer_csv(ruta):
    try:
        df = pd.read_csv(ruta, sep=';', encoding='utf-8-sig', decimal=',')

        print("Archivo cargado correctamente")
        print(df.head())

        return df

    except Exception as e:
        print("Error leyendo archivo:", e)