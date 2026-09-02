import os

directorios_a_escanear = ['./src']
archivos_adicionales = ['vite.config.js', 'package.json', 'index.html']
archivo_salida = 'contexto_gem.txt'
# Se añadió '.ts' para capturar tipos_supabase.ts
extensiones_validas = ('.vue', '.js', '.css', '.html', '.json', '.ts') 

with open(archivo_salida, 'w', encoding='utf-8') as salida:
    # 1. Procesar directorio src automáticamente
    for directorio in directorios_a_escanear:
        for raiz, _, archivos in os.walk(directorio):
            for archivo in archivos:
                if archivo.endswith(extensiones_validas):
                    ruta = os.path.join(raiz, archivo)
                    salida.write(f"\n\n{'='*50}\n--- ARCHIVO: {ruta} ---\n{'='*50}\n\n")
                    with open(ruta, 'r', encoding='utf-8') as f:
                        salida.write(f.read())

    # 2. Procesar archivos de la raíz
    for archivo in archivos_adicionales:
        if os.path.exists(archivo):
            salida.write(f"\n\n{'='*50}\n--- ARCHIVO: ./{archivo} ---\n{'='*50}\n\n")
            with open(archivo, 'r', encoding='utf-8') as f:
                salida.write(f.read())

print(f"Contexto empaquetado exitosamente en: {archivo_salida}")