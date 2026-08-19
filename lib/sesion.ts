import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Sesion del panel de administracion.
 *
 * Una sola contrasenia, sin usuarios ni registro: al panel entra la duenia del
 * negocio y nadie mas. Montar tabla de usuarios, correos de recuperacion y
 * roles para una persona seria mas superficie de ataque, no menos.
 *
 * La sesion es una cookie firmada, no un identificador guardado en memoria: el
 * servidor de Next se reinicia con cada cambio de codigo y una sesion en
 * memoria echaria fuera a quien estuviera editando a media carta.
 */

const COOKIE = "galu_panel";
/** Ocho horas: un turno. Al dia siguiente se vuelve a pedir la contrasenia. */
const DURACION_S = 8 * 60 * 60;

/**
 * ¿Estan puestas las dos variables que el panel necesita?
 *
 * Se comprueba antes de nada para poder AVISAR en vez de reventar con un 500
 * sin explicacion. Es el caso tipico del primer despliegue: el codigo sube
 * pero las variables se quedan sin configurar, y sin esto el panel responde
 * con una pagina de error que no dice cual es el problema.
 */
export function panelConfigurado(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SECRET);
}

function secreto(): string {
  const valor = process.env.ADMIN_SECRET;
  if (!valor) {
    throw new Error(
      "Falta ADMIN_SECRET en .env.local (cadena larga y aleatoria para firmar la sesion).",
    );
  }
  return valor;
}

function firmar(datos: string): string {
  return createHmac("sha256", secreto()).update(datos).digest("hex");
}

/**
 * Comparacion en tiempo constante.
 *
 * Un `===` normal se detiene en el primer caracter distinto, y ese tiempo de
 * mas o de menos deja adivinar la firma byte a byte a base de reintentos.
 */
function igualSeguro(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Contrasenia correcta? Tambien en tiempo constante. */
export function contraseniaValida(intento: string): boolean {
  const esperada = process.env.ADMIN_PASSWORD;
  if (!esperada) {
    throw new Error("Falta ADMIN_PASSWORD en .env.local.");
  }
  // Se comparan los resumenes, no los textos: asi la comparacion es siempre
  // sobre la misma longitud y no se filtra ni el largo de la contrasenia.
  return igualSeguro(firmar(intento), firmar(esperada));
}

export async function abrirSesion(): Promise<void> {
  const expira = Date.now() + DURACION_S * 1000;
  // El azar hace que dos sesiones seguidas no compartan valor, para que la
  // cookie de ayer no siga sirviendo si se copio de algun sitio.
  const cuerpo = `${expira}.${randomBytes(12).toString("hex")}`;
  const valor = `${cuerpo}.${firmar(cuerpo)}`;

  const almacen = await cookies();
  almacen.set(COOKIE, valor, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_S,
  });
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(COOKIE);
}

export async function haySesion(): Promise<boolean> {
  if (!panelConfigurado()) return false;

  const almacen = await cookies();
  const valor = almacen.get(COOKIE)?.value;
  if (!valor) return false;

  const corte = valor.lastIndexOf(".");
  if (corte === -1) return false;

  const cuerpo = valor.slice(0, corte);
  const firma = valor.slice(corte + 1);
  if (!igualSeguro(firma, firmar(cuerpo))) return false;

  const expira = Number(cuerpo.split(".")[0]);
  return Number.isFinite(expira) && Date.now() < expira;
}

/**
 * Corta la ejecucion si quien llama no tiene sesion.
 *
 * Va al principio de CADA accion del panel, no solo en el layout. Una Server
 * Action es un endpoint publico: se puede invocar desde fuera del panel, sin
 * pasar por ninguna pagina. Protegerlo solo con el layout dejaria la puerta de
 * atras abierta de par en par.
 */
export async function exigirSesion(): Promise<void> {
  if (!(await haySesion())) {
    throw new Error("Sesion no valida. Vuelve a entrar al panel.");
  }
}
