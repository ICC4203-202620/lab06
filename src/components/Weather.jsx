import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import fetchWeather, { NetworkError } from '../api/weatherApi';
import { loadWeather, saveWeather, formatSavedAt } from '../api/weatherCache';
import useConnectionStatus from '../hooks/useConnectionStatus';

const CITY = 'Santiago de Chile';

const Weather = () => {
  const [weather, setWeather] = useState(null);     // objeto de datos
  const [savedAt, setSavedAt] = useState(null);     // hora de la lectura, si viene del caché
  const [loading, setLoading] = useState(true);     // estado de carga
  const [error, setError] = useState('');           // mensaje de error
  const [status] = useConnectionStatus();

  // El efecto se vuelve a ejecutar cuando la conexión cae y cuando vuelve, de
  // modo que al recuperar la red la lectura guardada se reemplaza sola por una
  // consulta nueva a la API.
  const disconnected = status === 'offline';

  useEffect(() => {
    // React apaga esta bandera en el return de abajo, y ejecuta esa limpieza
    // antes de volver a correr el efecto. Así, si la conexión cambia mientras
    // una petición está en vuelo, la respuesta que llegue tarde no pisa el
    // estado que dejó la ejecución más reciente: solo la vigente escribe.
    let current = true;

    (async () => {
      try {
        setLoading(true);
        setError('');
        const temps = await fetchWeather(CITY); // Open‑Meteo version

        if (!current) return;

        if (temps) {
          saveWeather(CITY, temps);
          setWeather(temps);
          setSavedAt(null);
        } else {
          setError('No se pudo obtener el clima.');
        }
      } catch (e) {
        if (!current) return;

        // Falló la red. Si hay una lectura guardada la mostramos, señalando de
        // cuándo es; si no hay nada guardado, no queda más que avisar.
        const cached = e instanceof NetworkError ? loadWeather(CITY) : null;

        if (cached) {
          setWeather(cached.weather);
          setSavedAt(cached.savedAt);
        } else if (e instanceof NetworkError) {
          setError('Sin conexión, y no hay información guardada para mostrar.');
        } else {
          setError('Ocurrió un error al obtener el clima.');
        }
      } finally {
        if (current) setLoading(false);
      }
    })();

    return () => { current = false; };
  }, [disconnected]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body1" component="p">
          Cargando datos del clima...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body1" component="p" color="error">
        {error}
      </Typography>
    );
  }

  if (!weather) return null;

  const {
    label,                // "Santiago, Región Metropolitana, Chile"
    temp,                 // actual (aprox.)
    tempMinForecast,      // mínima pronosticada hoy
    tempMaxForecast,      // máxima pronosticada hoy
  } = weather;

  return (
    <Box>
      <Typography variant="h6" component="h1" gutterBottom>
        {label || 'Santiago, Chile'}
      </Typography>

      {temp != null && (
        <Typography variant="body1" component="p">
          Actual: {temp} °C
        </Typography>
      )}

      {(tempMinForecast != null || tempMaxForecast != null) && (
        <Typography variant="body2" component="p">
          Mín. pronosticada hoy: {tempMinForecast ?? '—'} °C — Máx. pronosticada hoy: {tempMaxForecast ?? '—'} °C
        </Typography>
      )}

      {/* Solo cuando el dato viene del caché: el aviso de que no hay conexión
          lo da ConnectionStatus, y lo que falta acá es de cuándo es el dato. */}
      {savedAt !== null && (
        <Typography variant="caption" component="p" color="text.secondary" sx={{ mt: 1.5 }}>
          Última actualización: {formatSavedAt(savedAt)}.
        </Typography>
      )}
    </Box>
  );
};

export default Weather;
