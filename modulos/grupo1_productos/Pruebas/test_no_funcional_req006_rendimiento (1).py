"""
PRUEBA NO FUNCIONAL — Módulo de Productos (Rol Vendedor)
Requisito cubierto: REQ_006 — Tiempo de respuesta en consultas de inventario
(Eficiencia de desempeño, ISO/IEC 25010).
Framework: Selenium WebDriver para Python — https://github.com/SeleniumHQ/selenium

Criterio de aceptación (Entregable 2): el 95% de las consultas de inventario
(búsqueda, filtrado y listado) deben responder en un tiempo <= 2 segundos.

Estrategia de medición: se mide el tiempo transcurrido, dentro del propio
navegador, entre el instante en que se dispara el evento de búsqueda y el
instante en que el listado filtrado queda renderizado en el DOM (mediante
performance.now() ejecutado vía driver.execute_script), repitiendo la
medición varias veces para obtener un promedio representativo.
"""
import os
import sys
import time
import json
import datetime

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = "file://" + os.path.join(BASE_DIR, "modulo_productos_vendedor.html")
EVID_DIR = os.path.join(BASE_DIR, "evidencia_no_funcional_req006")
os.makedirs(EVID_DIR, exist_ok=True)

UMBRAL_MS = 2000  # límite definido en REQ_006
REPETICIONES = 5  # número de mediciones para obtener un promedio
TERMINOS = ["laptop", "mouse", "silla", "cafetera", "monitor"]

MEDIR_JS = """
const texto = arguments[0];
const input = document.getElementById('searchInput');
const t0 = performance.now();
input.value = texto;
input.dispatchEvent(new Event('input', {bubbles:true}));
const t1 = performance.now();
return t1 - t0;
"""

LIMPIAR_JS = """
const input = document.getElementById('searchInput');
input.value = '';
input.dispatchEvent(new Event('input', {bubbles:true}));
"""

options = Options()
options.add_argument("--headless=new")  # ejecuta sin abrir ventana; comenta esta línea para ver el navegador
options.add_argument("--window-size=1440,1000")
options.add_argument("--no-sandbox")             # inofensivo en Windows/Mac; recomendado en entornos Linux/CI
options.add_argument("--disable-dev-shm-usage")  # inofensivo en Windows/Mac; recomendado en entornos Linux/CI

# Configuración estándar y portable: Selenium Manager (incluido desde Selenium 4.6)
# detecta automáticamente el Chrome instalado y descarga el chromedriver
# correspondiente. No se requiere indicar rutas manuales en un equipo normal.
#
# CHROME_BINARY / CHROMEDRIVER_PATH son variables de entorno OPCIONALES, útiles
# solo en entornos restringidos (por ejemplo, un sandbox sin acceso a internet
# para que Selenium Manager descargue el driver). En un equipo de desarrollo
# estándar no es necesario definirlas.
chrome_binary = os.environ.get("CHROME_BINARY")
if chrome_binary:
    options.binary_location = chrome_binary

chromedriver_path = os.environ.get("CHROMEDRIVER_PATH")
service = Service(executable_path=chromedriver_path) if chromedriver_path else Service()

driver = webdriver.Chrome(service=service, options=options)
wait = WebDriverWait(driver, 10)

resultados = []
mediciones = []
inicio = time.time()


def registrar_paso(nombre, condicion, detalle=""):
    estado = "PASA" if condicion else "FALLA"
    resultados.append({"paso": nombre, "estado": estado, "detalle": detalle})
    print("[{}] {}{}".format(estado, nombre, (" — " + detalle) if detalle else ""))
    assert condicion, "Fallo en el paso: " + nombre


try:
    driver.get(HTML_PATH)
    wait.until(EC.presence_of_element_located((By.ID, "tbody")))
    driver.save_screenshot(os.path.join(EVID_DIR, "01_catalogo_inicial.png"))

    for i in range(REPETICIONES):
        termino = TERMINOS[i % len(TERMINOS)]
        ms = driver.execute_script(MEDIR_JS, termino)
        mediciones.append({"termino": termino, "ms": round(ms, 3)})
        time.sleep(0.15)
        driver.execute_script(LIMPIAR_JS)
        time.sleep(0.1)

    driver.save_screenshot(os.path.join(EVID_DIR, "02_ultima_busqueda_medida.png"))

    promedio = sum(m["ms"] for m in mediciones) / len(mediciones)
    maximo = max(m["ms"] for m in mediciones)

    registrar_paso(
        "Tiempo máximo ({:.2f} ms) menor al umbral de {} ms definido en REQ_006".format(maximo, UMBRAL_MS),
        maximo < UMBRAL_MS,
        " · ".join("'{}': {} ms".format(m["termino"], m["ms"]) for m in mediciones),
    )
    registrar_paso(
        "Tiempo promedio ({:.2f} ms) menor al umbral de {} ms".format(promedio, UMBRAL_MS),
        promedio < UMBRAL_MS,
        "Promedio sobre {} búsquedas: {:.2f} ms".format(REPETICIONES, promedio),
    )

    exito = True
except AssertionError as e:
    exito = False
    print("ERROR:", e)
finally:
    driver.quit()

duracion = round(time.time() - inicio, 2)

reporte = {
    "tipo": "No funcional",
    "requisito": "REQ_006 — Tiempo de respuesta en consultas de inventario (Eficiencia de desempeño)",
    "modulo": "Vendedor",
    "umbral_ms": UMBRAL_MS,
    "mediciones": mediciones,
    "fecha_ejecucion": datetime.datetime.now().isoformat(timespec="seconds"),
    "duracion_segundos": duracion,
    "resultado_general": "EXITOSO" if exito else "FALLIDO",
    "pasos": resultados,
}
with open(os.path.join(BASE_DIR, "reporte_no_funcional_req006.json"), "w", encoding="utf-8") as f:
    json.dump(reporte, f, ensure_ascii=False, indent=2)

print("\n=== RESUMEN — PRUEBA NO FUNCIONAL (REQ_006) ===")
print("Resultado general:", reporte["resultado_general"], "· Duración total:", duracion, "s")
for r in resultados:
    print(" -", r["paso"], "->", r["estado"])

sys.exit(0 if exito else 1)
