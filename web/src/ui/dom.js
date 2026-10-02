// Ayudantes de DOM compartidos por el panel y los visores de observabilidad.
//
// Los datos del usuario nunca pasan por innerHTML: se insertan como nodos de texto.

/** Crea un elemento con atributos y texto seguro. Un atributo null/undefined/false se omite. */
export function crear(etiqueta, atributos = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [nombre, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) continue;
    nodo.setAttribute(nombre, valor === true ? '' : String(valor));
  }
  nodo.append(...hijos.filter((hijo) => hijo !== null && hijo !== undefined && hijo !== false));
  return nodo;
}

/** Busca por el atributo data-testid, la convención de selectores del proyecto. */
export const porTestId = (id, raiz = document) => raiz.querySelector(`[data-testid="${id}"]`);
