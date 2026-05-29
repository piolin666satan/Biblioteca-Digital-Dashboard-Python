def analizar_datos(df):

    print("\nCantidad registros:")
    print(df.shape)

    print("\nTipos de datos:")
    print(df.dtypes)

    print("\nEstadísticas:")
    print(df.describe())

    return {
        "filas": df.shape[0],
        "columnas": df.shape[1]
    }