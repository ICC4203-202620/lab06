# Laboratorio 6: Introducción al desarrollo de PWAs con React y MUI

En este laboratorio veremos una aplicación de clima construida utilizando lo básico de React y MUI, empaquetada como PWA para que siga funcionando cuando el dispositivo pierde la conexión. La aplicación utiliza la API de [Open-Meteo](https://open-meteo.com/) para acceder a información climática. Esta API tiene posibilidad de [uso gratuito](https://open-meteo.com/en/pricing), sin registro de usuario, lo cual es sumamente beneficioso para nuestra experiencia de laboratorio.

## Pasos iniciales

Antes de partir, verifica tu versión de Node.js con `node -v`. Vite 8 requiere Node 20.19 o superior, o bien 22.12 o superior. Si tienes una versión anterior, actualízala con [nvm](https://github.com/nvm-sh/nvm) o con el instalador de [nodejs.org](https://nodejs.org/).

El primer paso es ejecutar:

```sh
yarn install
```

Esto instalará todos los paquetes o módulos especificados en el archivo `package.json` que requiere la aplicación. Preferimos utilizar Yarn para gestión de módulos y dependencias de Javascript.

Con esto, la aplicación estará lista para ejecutar:

```sh
yarn dev
```

El comando anterior ejecuta la aplicación en modo de desarrollo. Puedes abrir el navegador web en [http://localhost:5173/](http://localhost:5173/) para ver el funcionamiento.

## Lo básico de Vite

Usamos Vite (https://vitejs.dev/) como andamiaje para crear nuestra aplicación utilizando React 19. Vite provee una serie de herramientas, por ejemplo, generadores parecidos a los que tiene una aplicación Rails, que permiten crear una aplicación de frontend a partir de cero, y preparar una aplicación para producción.

Si abres el archivo `package.json` verás que hay un objeto con clave `"scripts"` declarado. Este objeto define varias tareas posibles de realizar utilizando Vite, invocándolas con Yarn según nuestras preferencias de ambiente de desarrollo.

Los scripts relevantes son:

* `dev`: Permite levantar la aplicación en modo desarrollo como hemos visto arriba.
* `build`: Prepara la aplicación para ponerla en ambiente de producción.
* `lint`: Ejecuta linters para validar que el código cumpla estándares de codificación, y normas de calidad.
* `preview`: Permite previsualizar la aplicación después que ha sido construida con `build`.

## Descripción de la Aplicación React

Nuestra aplicación React en su primera iteración es bastante simple y se limita a llamar a la API de Open-Meteo para realizar un par de consultas. Resuelve las coordenadas GPS de Santiago de Chile usando una API de "Geocoder", y luego, con estas coordenadas, llama a la API de clima utlizando las funciones de una biblioteca llamada Axios ([https://axios-http.com/docs/intro](https://axios-http.com/docs/intro)), para obtener la información del clima actual. Axios permite realizar peticiones XHR a APIs remotas, con funcionalidad similar a la Fetch API estándar que implementan los navegadores web, sin embargo, Axios provee una serie de conveniencias:

* Convierte automáticamente respuestas JSON de la API de backend directamente a objetos Javascript. De otro modo, es necesario llamar a `JSON.parse` en forma manual para convertir respuestas JSON a objetos.
* Simplifica el paso de parámetros a las APIs remotas.
* Ofrece soporte para eventos de carga y descarga cuando se trabaja con archivos.
* Permite cancelar solicitudes en forma simple.
* Permite modificar solicitudes y respuestas utilizando lógica encapsulable (interceptores).
* Simplifica la sintaxis para realizar solicitudes a las APIs.

La aplicación al cargarse realiza las invocaciones con axios a las APIs de Open-Meteo y luego el resultado es desplegado en un componente `Weather` que se encuentra inserto en la aplicación.

### Componentes de la Aplicación

**Index**

La página de carga de la aplicación SPA desarrollada con React es `index.html`. En este archivo se declara un elemento raíz de tipo `div` con `id` con valor `root`, y se carga el archivo `main.jsx`. Este último archivo instancia el componente principal de la aplicación llamado `App` (ver `App.jsx`):

```es6
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme'; // Asegúrate de importar el tema
import registerServiceWorker from './registerServiceWorker';

// Convierte la aplicación en una PWA: deja el service worker a cargo de los
// archivos para que la aplicación pueda abrirse sin conexión.
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <App />
        </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

**Theme de MUI**

Existe un _theme_ de MUI (Material UI) configurado para la aplicación que se encuentra descrito en `src/theme.js`. Es posible variar la tipografía Roboto utilizada en la aplicación, el esquema de colores, y en general alterar todas las propiedades personalizables de los componentes de MUI.

El componente `ThemeProvider` decora `App` con el _theme_ cargado en el propio archivo `main.jsx`.

**BrowserRouter**

Luego, hay un componente `BrowserRouter`, provisto por React, que permite que la aplicación de frontend pueda tener sus propios enlaces (hipervínculos) locales, y procesar los paths que hay en la barra de direcciones del navegador interpretándolos en el contexto local del frontend. Los enlaces permiten acceder a distintos componentes de la aplicación que quedan instanciados por el componente `App`. 

**React.StrictMode**

Finalmente `React.StrictMode` permite comunicar advertencias o errores al desarrollador respecto a prácticas erróneas en el desarrollo de la aplicación, asociadas a potenciales problemas de calidad.

**Componente App**

El archivo `App.jsx` declara el componente principal de la aplicación `App`, junto con componentes que se instancian cuando se está en la ruta raíz `/` (`Home`) y en la ruta `/search` (`Search`). 

El componente `App` maneja una única variable de estado con el hook de _state_, que permite alternar la vista del menú de navegación, haciendo click en el botón que se encuentra en la barra superior (ver `AppBar` y uso de la variable de estado `toggleDrawer`).

El menú de navegación está construido con un componente tipo `List` de React que permite que los ítemes queden enlazados a otros componentes; `Home` y `Search`.

Justo antes de las rutas, `App` instancia `ConnectionStatus`, el componente que avisa al usuario cuando el dispositivo se queda sin conexión y cuando la recupera. Se describe más adelante, en la sección sobre el funcionamiento sin conexión.

En las líneas finales de `App.jsx` se encuentra el componente `Routes` que en forma análoga a `routes.rb` en el backend de la aplicación Rails, define una lista de rutas que son válidas para la aplicación que se ejecuta en el _frontend_.

**Componente Home**

El componente `Home` incluye algunos componentes de MUI, como el de [`Card`](https://mui.com/material-ui/react-card/) y `CardContent`. Sin embargo, el propósito de `Card` es proveer un área en la cual instanciar el componente `Weather` que realiza las acciones relevantes en nuestra aplicación.

**Componente Weather**

En este componente hay cuatro variables de estado (hook `useState` de React) relevantes que son instanciadas:

* `weather`: Guarda el objeto con la información meteorológica obtenida desde la API (temperatura actual, mínima y máxima observada, mínima y máxima pronosticada, y etiqueta de ubicación). Inicialmente es `null`, y se actualiza una vez que la petición a la API se completa exitosamente.
* `loading`: Bandera booleana que indica si el componente está en proceso de obtener los datos desde la API. Es `true` al inicio de la carga y vuelve a `false` cuando la petición finaliza (ya sea con éxito o con error). Permite mostrar un spinner o mensaje de `cargando`.
* `error`: Almacena un mensaje de error (`string`) cuando ocurre algún problema en la obtención de los datos. Inicialmente es '' (vacío). Se usa para informar al usuario cuando no se puede mostrar la información del clima.
* `savedAt`: Marca de tiempo de la lectura, cuando lo que se está mostrando salió del caché por falta de conexión. Vale `null` mientras el dato viene de la red, y en la sección siguiente se explica de dónde sale.

**Cliente de Open-Meteo**

Las operaciones clientes de Open-Meteo las encapsulamos en un módulo llamado `weatherApi`, ubicado en `src/api/weatherApi.js`. En la función `fetchWeather` al final de este módulo podrás ver cómo se resuelven las coordenadas de una ubicación usando geocoder, y cómo después se obtienen los valores del tiempo para la ubicación.

## Funcionamiento sin conexión

La aplicación es una PWA: el navegador puede instalarla como si fuera nativa, y sigue sirviendo información cuando el dispositivo se queda sin red. Tres piezas lo hacen posible, con responsabilidades bien separadas.

**El manifiesto**

`public/manifest.webmanifest` describe la aplicación para el sistema operativo: su nombre, el color de la barra de estado, la pantalla desde la que arranca (`start_url`) y los iconos, que están en `public/icons`. El icono marcado con `"purpose": "maskable"` es el que Android recorta con la forma que use el lanzador del teléfono, y por eso su dibujo va reducido sobre un fondo a sangre. En `index.html` un `<link rel="manifest">` lo enlaza, y un `<meta name="theme-color">` fija el color que el navegador aplica a su propia interfaz mientras la aplicación está abierta.

**El service worker**

`public/sw.js` es un script que corre en su propio hilo, sin acceso al DOM, y que el navegador conserva entre visitas. Queda situado entre la aplicación y la red: toda petición que sale del documento pasa por su evento `fetch`, y ahí se decide qué se responde desde el caché y qué se pide a la red.

Su ciclo de vida tiene tres momentos, y los tres están en el archivo:

* `install` se ejecuta una vez por versión del service worker. Aquí se guarda el _app shell_, es decir, los archivos mínimos para que la aplicación pueda abrirse: `index.html`, el manifiesto, los iconos y el bundle de Javascript.
* `activate` es el momento de la limpieza. Recorre los cachés que existan y borra los que no correspondan a la versión vigente, declarada en la constante `CACHE`. Al cambiar ese nombre se fuerza un precacheo completo y se descartan los archivos de la versión anterior.
* `fetch` intercepta las peticiones, una por una.

El nombre del bundle incluye un hash de su contenido y cambia en cada `yarn build`, así que no se puede escribir a mano en la lista de precacheo. Para resolverlo, `vite.config.js` activa `build.manifest`, que deja en `dist/assets-manifest.json` la lista de los archivos generados con sus nombres definitivos, y el service worker la lee al instalarse. Las herramientas de producción, como Workbox, resuelven esto igual, con la diferencia de que inyectan la lista dentro del service worker durante el build.

En el evento `fetch` conviven dos estrategias de caché:

* Red primero, para la navegación. El usuario ve siempre la versión más reciente de la aplicación, y solo cuando la red falla se sirve el `index.html` guardado. Esto es además lo que permite abrir `/search` sin conexión, porque esa ruta la resuelve el router dentro del navegador y no existe como archivo en el servidor.
* Caché primero, para el bundle, los iconos y las tipografías de Google. Esas URLs devuelven siempre el mismo contenido, de modo que consultar la red teniéndolas guardadas sería trabajo perdido.

Las peticiones a Open-Meteo quedan deliberadamente fuera, y el service worker las deja pasar sin tocarlas. Si las respondiera desde el caché, la aplicación recibiría una temperatura sin manera de saber si es de ahora o de anteayer, y esa hora es justamente lo que queremos mostrar en pantalla.

El registro está en `src/registerServiceWorker.js` y ocurre solo en la aplicación construida. En `yarn dev`, Vite sirve cada módulo por separado, y un caché en el medio dejaría al navegador con versiones viejas del código.

**El caché de los datos**

`src/api/weatherCache.js` guarda en `localStorage` la última lectura de cada ciudad junto con la hora en que se obtuvo. Son tres funciones: `saveWeather`, `loadWeather` y `formatSavedAt`, esta última encargada de expresar la antigüedad en palabras con `Intl.RelativeTimeFormat`. Todos los accesos van dentro de un `try`, porque en modo privado o con el almacenamiento bloqueado por el usuario `localStorage` lanza una excepción al usarse.

**Distinguir un problema de red de una ciudad inexistente**

`fetchWeather`, en `src/api/weatherApi.js`, tiene dos maneras de fallar, y a la aplicación le importa la diferencia:

* Devuelve `null` cuando la ciudad no existe, y entonces corresponde pedirle al usuario que corrija la búsqueda.
* Lanza un `NetworkError` cuando la petición nunca obtuvo respuesta, y entonces corresponde mostrar la lectura guardada.

La distinción se hace con `axios.isAxiosError(err) && !err.response`, porque axios deja sin `response` las peticiones que no llegaron a destino, mientras que un 404 o un 500 sí la traen.

**El estado de la conexión**

`src/hooks/useConnectionStatus.js` es un hook propio que escucha los eventos `online` y `offline` de `window` y devuelve uno de tres valores: `'offline'`, `'reconnected'` y `'online'`. El valor intermedio existe para poder avisar una sola vez que la red volvió, y se consume llamando a `acknowledge()`.

Conviene saber que `navigator.onLine` no da para más que eso: informa si el equipo tiene una interfaz de red activa, y puede decir `true` estando conectado a un router sin salida a Internet. En esta aplicación cumple el papel de aviso en pantalla, y la decisión de recurrir al caché la toma `Weather` cuando una petición falla de verdad.

Dos componentes consumen el hook. `ConnectionStatus` muestra la barra permanente mientras no hay red y la notificación breve cuando vuelve. `Weather` usa el estado como dependencia de su `useEffect`, y de ahí sale la recuperación automática: al volver la conexión el efecto se ejecuta otra vez, consulta la API y reemplaza la lectura guardada por una nueva.

Que el efecto dependa del estado de la conexión trae una consecuencia que conviene mirar de cerca: dos consultas pueden quedar solapadas. Si la red se cae con una petición en vuelo, esa petición falla, la ejecución nueva del efecto también, y la respuesta que llegue tarde no debe pisar lo que dejó la más reciente. De eso se encarga la bandera `current` que el efecto apaga en su `return`, porque React ejecuta esa limpieza antes de cada nueva corrida. Mientras el efecto tenía la lista de dependencias vacía el problema no existía, ya que corría una sola vez.

El aviso de que no hay conexión se da una sola vez, en esa barra, porque es un estado de la aplicación entera. `Weather` no lo repite: junto a los datos agrega solo la línea con su última actualización, que es justamente lo que la barra no puede saber, ya que cada dato en pantalla puede tener una antigüedad distinta. Dos alertas diciendo lo mismo, una encima de la otra, se ven mal y hacen dudar de si describen dos problemas.

**Cómo probarlo**

El service worker no corre en modo desarrollo, de manera que hay que construir la aplicación y servirla:

```sh
yarn build
yarn preview
```

Las herramientas de desarrollo organizan esto de manera distinta en cada navegador, así que conviene ubicar primero los tres lugares que vamos a usar:

| qué necesitamos | Chrome y Edge | Firefox |
| --- | --- | --- |
| cortar la conexión | Application, sección Service Workers, casilla Offline | Red, menú de _throttling_, preset Offline |
| archivos que guardó el service worker | Application, Cache Storage | Almacenamiento, Cache Storage |
| datos que guardó la aplicación | Application, Local Storage | Almacenamiento, Local Storage |

Firefox también tiene un panel Application, donde se ve el service worker registrado y la validación del manifiesto, pero el corte de conexión se hace desde el panel de red.

Con la aplicación abierta en [http://localhost:4173/](http://localhost:4173/), espera a que cargue el clima y sigue estos pasos:

1. Corta la conexión y recarga. La aplicación se abre completa desde el caché, aparece la barra de aviso y el clima se muestra con la hora de su última actualización. En Cache Storage puedes revisar los archivos guardados bajo `weather-app-v1`, y en Local Storage la entrada `weather:santiago de chile`.
2. Sin restablecer la conexión, entra a Buscar desde el menú lateral, para comprobar que las rutas del router se resuelven igual.
3. Restablece la conexión y observa la notificación de recuperación y la consulta nueva a la API.
4. Borra la entrada de Local Storage, corta la conexión otra vez y recarga, para ver el caso en que no hay nada guardado que mostrar.

Dos advertencias antes de partir. En una ventana privada de Firefox los service workers están deshabilitados, de modo que la aplicación se comportará como si no hubiera caché, sin ninguna explicación en pantalla; usa una ventana normal. Y la instalación la ofrecen en el escritorio solo Chrome y Edge, desde el icono que aparece en la barra de direcciones: al instalarla podrás comprobar que abre en su propia ventana, sin barra del navegador. Firefox de escritorio no instala PWAs, y en Firefox para Android la opción está en el menú, como «Agregar a la pantalla de inicio».

Un último detalle de Firefox, para que no te haga perder tiempo: cuando una petición a Open-Meteo no llega a destino, su consola lo reporta como «CORS request did not succeed», con estado nulo. Así describe Firefox una petición que falló sin obtener respuesta, y es el mismo caso que `weatherApi.js` reconoce como `NetworkError`.

## Anatomía de un hook propio

Los hooks propios son materia de la clase siguiente, y este proyecto trae uno pequeño que sirve bien como primer ejemplo: `useConnectionStatus`, en `src/hooks/useConnectionStatus.js`. Conviene leerlo con detalle, porque el patrón reaparece en cualquier aplicación que tenga que reaccionar a algo que ocurre fuera de React.

Un hook propio es una función que llama a los hooks estándar que ya conoces, `useState` y `useEffect`, y que vive fuera de los componentes para que varios puedan usarla. Todo el mecanismo es ese. La condición de la que dependen React y el linter (analizador de código automático usado en este proyecto para detectar bugs, anomalías, etc.) es el nombre, que tiene que empezar con `use`.

Las reglas de los hooks valen igual dentro de un hook propio. Se llaman siempre en el nivel superior de la función, jamás dentro de un `if` ni de un ciclo, porque React identifica cada hook por el orden en que se lo llama; y solo se llaman desde un componente o desde otro hook. Las dos reglas las revisa `eslint-plugin-react-hooks`, que el proyecto tiene configurado, así que `yarn lint` te avisa si las rompes.

**Por qué extraerlo**

Tres componentes necesitan saber si hay conexión: `ConnectionStatus` para mostrar el aviso, y `Weather` (y `Search`, cuando lo construyas) para volver a consultar la API en cuanto la red regrese. Si cada uno declarara su propia variable de estado y su propio `useEffect` con los dos `addEventListener` y los dos `removeEventListener`, el mismo bloque de once líneas quedaría escrito tres veces, y bastaría con corregir uno para que los otros se queden atrás.

**El estado inicial**

```es6
const [status, setStatus] = useState(() => (navigator.onLine ? 'online' : 'offline'));
```

El estado arranca leyendo el valor actual del navegador, porque la aplicación puede cargarse cuando ya no hay conexión. Lo que recibe `useState` es un _inicializador diferido_: una función que React llama solo en el primer render. Acá `useState(navigator.onLine ? 'online' : 'offline')` daría el mismo resultado, ya que leer esa propiedad es instantáneo. La forma con función se usa cuando calcular el valor inicial cuesta caro, para que ese cálculo no se repita en cada render.

**La suscripción y su limpieza**

```es6
useEffect(() => {
  const goOffline = () => setStatus('offline');
  const goOnline = () => setStatus('reconnected');

  window.addEventListener('offline', goOffline);
  window.addEventListener('online', goOnline);

  return () => {
    window.removeEventListener('offline', goOffline);
    window.removeEventListener('online', goOnline);
  };
}, []);
```

La lista de dependencias vacía indica que la suscripción ocurre una sola vez, al montar el componente. El `return` es la parte que más se olvida: sin él, cada montaje dejaría un listener escuchando para siempre. Con `StrictMode` activo, React monta y desmonta el efecto una vez extra en desarrollo, precisamente para que una limpieza ausente se note temprano.

Fíjate además en que los manejadores se guardan en constantes. `addEventListener` y `removeEventListener` tienen que recibir exactamente la misma referencia para que el segundo deshaga lo que hizo el primero; con dos funciones anónimas escritas por separado, la limpieza se ejecutaría sin efecto alguno.

Los `setStatus` de esos manejadores corren en respuesta a un evento del navegador, que es un momento en el que React acepta un cambio de estado sin objeciones.

**La función que se devuelve**

```es6
const acknowledge = useCallback(() => setStatus('online'), []);

return [status, acknowledge];
```

`acknowledge` existe porque el valor `'reconnected'` hay que consumirlo: `ConnectionStatus` lo usa para cerrar la notificación y dejar el estado en `'online'`. Va envuelto en `useCallback` para que sea la misma función entre renders, algo que importa cuando se la pasa como prop a un componente o cuando se la nombra en una lista de dependencias.

El hook devuelve un arreglo, siguiendo la convención de `useState`, y así quien lo llama les pone a las dos posiciones el nombre que quiera.

**Cada llamada tiene su propio estado**

Este es el punto que más confunde al principio. `ConnectionStatus` y `Weather` llaman al mismo hook, y cada uno recibe una variable de estado independiente de la del otro. Se mantienen coordinados porque los dos escuchan los mismos eventos del navegador, y no porque el hook guarde algo en común.

La distinción importa el día que necesites estado realmente compartido, algo que un componente escribe y otro lee. Un hook por sí solo no alcanza para eso, y ahí entra el Context de React.

**Qué merece ser un hook**

Un buen candidato es la lógica que combina estado con un efecto y aparece repetida en varios componentes. Lo que no llama a ningún hook se queda como función normal: `formatSavedAt`, en `src/api/weatherCache.js`, recibe una marca de tiempo y devuelve un texto, sin estado y sin efectos, y por eso su nombre no empieza con `use`.

## Experimenta con el código

1. Puedes partir usando mensajes `console.debug` en el componente `Weather` para desplegar en consola la respuesta que se obtiene al llamar a la API de clima (variable `temps`). También podrías revisar cómo están implementadas las llamadas a la API en `src/api/weatherApi.js`.
2. Luego, en `Weather` puedes modificar la ubicación geográfica, y verificar los resultados.
3. Puedes personalizar el componente `Search` declarado en `App.jsx`. Incorpora un [campo de texto](https://mui.com/material-ui/react-text-field/) para la búsqueda, asócialo a una variable de estado (p.ej., `useState(location)`), y luego, agrega un hook de `useEffect` que vigile `location`, invoque a las APIs de clima (usa `fetchWeather` del módulo `weatherApi`), y despliegue en la consola el resultado de clima (`console.log`) de acuerdo con la ubicación geográfica tipeada en el campo de texto. 
4. Si quieres hacer algo más avanzado aún, puedes crear un componente `SearchResult` que muestre el resultado de la búsqueda de `Search` (poniéndolo como hijo de este último) al existir algún resultado de búsqueda. El componente `Search` lo puedes mover fuera de `App` y lo puedes poner bajo el directorio de `components`.
5. Puedes ajustar los estilos utilizados en la aplicación variando colores en `src/theme.js`.

