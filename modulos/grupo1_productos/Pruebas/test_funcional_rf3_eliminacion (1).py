"""
PRUEBA FUNCIONAL — Módulo de Productos (Rol Administrador)
Requisito cubierto: RF3 / REQ_003 — Eliminación (lógica) de productos del catálogo.
Framework: Selenium WebDriver para Python — https://github.com/SeleniumHQ/selenium

Flujo probado:
  1) Cargar el catálogo y confirmar el número inicial de productos.
  2) Hacer clic en el icono de eliminar de un producto y confirmar en el modal.
  3) Verificar que el producto desaparece del listado activo y que el
     sistema muestra el mensaje de confirmación "Producto eliminado".
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

# ---------------------------------------------------------------------------
# Configuración del navegador
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = "file://" + os.path.join(BASE_DIR, "modulo_productos_admin.html")
EVID_DIR = os.path.join(BASE_DIR, "evidencia_funcional_rf3")
os.makedirs(EVID_DIR, exist_ok=True)

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
inicio = time.time()


def registrar_paso(nombre, condicion, screenshot, detalle=""):
    estado = "PASA" if condicion else "FALLA"
    driver.save_screenshot(os.path.join(EVID_DIR, screenshot))
    resultados.append({"paso": nombre, "estado": estado, "detalle": detalle, "evidencia": screenshot})
    print("[{}] {}{}".format(estado, nombre, (" — " + detalle) if detalle else ""))
    assert condicion, "Fallo en el paso: " + nombre


try:
    # -----------------------------------------------------------------
    # Precondición: cargar el catálogo y registrar el estado inicial
    # -----------------------------------------------------------------
    driver.get(HTML_PATH)
    wait.until(EC.presence_of_element_located((By.ID, "tbody")))
    total_inicial = int(driver.find_element(By.ID, "statTotal").text)
    driver.save_screenshot(os.path.join(EVID_DIR, "01_catalogo_inicial.png"))

    # -----------------------------------------------------------------
    # Paso 1: clic en eliminar el producto P005 (Escritorio Modular)
    # -----------------------------------------------------------------
    driver.find_element(By.CSS_SELECTOR, '[data-delete="id_4"]').click()
    wait.until(EC.visibility_of_element_located((By.ID, "deleteModal")))
    driver.save_screenshot(os.path.join(EVID_DIR, "02_modal_confirmacion.png"))

    # -----------------------------------------------------------------
    # Paso 2: confirmar la eliminación
    # -----------------------------------------------------------------
    driver.find_element(By.ID, "btnConfirmDelete").click()

    # -----------------------------------------------------------------
    # Aserciones
    # -----------------------------------------------------------------
    toast_msg = wait.until(EC.visibility_of_element_located((By.ID, "toastMsg")))
    mensaje = toast_msg.text
    registrar_paso(
        "El sistema muestra el mensaje \"Producto eliminado\"",
        "producto eliminado" in mensaje.lower(),
        "03_mensaje_confirmacion.png",
        "Mensaje mostrado: '{}'".format(mensaje),
    )

    time.sleep(0.3)
    total_final = int(driver.find_element(By.ID, "statTotal").text)
    registrar_paso(
        "El contador de productos disminuyó en 1",
        total_final == total_inicial - 1,
        "04_contador_actualizado.png",
        "Total antes: {} · Total después: {}".format(total_inicial, total_final),
    )

    driver.find_element(By.ID, "searchInput").send_keys("Escritorio Modular")
    time.sleep(0.3)
    filas = driver.find_elements(By.CSS_SELECTOR, "#tbody tr")
    registrar_paso(
        "El producto eliminado ya no aparece en el listado activo",
        len(filas) == 0,
        "05_producto_no_visible_en_activos.png",
        "{} resultado(s) al buscar 'Escritorio Modular'".format(len(filas)),
    )

    exito = True
except AssertionError as e:
    exito = False
    print("ERROR:", e)
finally:
    driver.quit()

duracion = round(time.time() - inicio, 2)

reporte = {
    "tipo": "Funcional",
    "requisito": "RF3 / REQ_003 — Eliminación de productos del catálogo",
    "modulo": "Administrador",
    "fecha_ejecucion": datetime.datetime.now().isoformat(timespec="seconds"),
    "duracion_segundos": duracion,
    "resultado_general": "EXITOSO" if exito else "FALLIDO",
    "pasos": resultados,
}
with open(os.path.join(BASE_DIR, "reporte_funcional_rf3.json"), "w", encoding="utf-8") as f:
    json.dump(reporte, f, ensure_ascii=False, indent=2)

print("\n=== RESUMEN — PRUEBA FUNCIONAL (RF3) ===")
print("Resultado general:", reporte["resultado_general"], "· Duración:", duracion, "s")
for r in resultados:
    print(" -", r["paso"], "->", r["estado"])

sys.exit(0 if exito else 1)
