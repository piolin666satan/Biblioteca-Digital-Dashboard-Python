def limpiar_datos(df):

    # Eliminar filas vacías
    df = df.dropna()

    # Eliminar duplicados
    df = df.drop_duplicates()

    # Normalizar nombres columnas
    df.columns = df.columns.str.strip().str.lower()

    print("Datos limpios correctamente")

    return df