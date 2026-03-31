import { useState, useEffect } from 'react';
import axios from 'axios';
import api, { getMediaUrl } from '../services/api';

export default function AvatarImage({ src, alt, style, className }) {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (!src) return;
    
    // Par défaut, générer l'URL complète
    const url = getMediaUrl(src);

    if (src.startsWith('data:') || src.startsWith('blob:') || (url && url.includes('localhost'))) {
      setObjectUrl(url);
      return;
    }

    let isMounted = true;
    
    // Si Ngrok est utilisé, l'image sera bloquée par l'avertissement de navigateur.
    // On télécharge donc l'image avec Axios (qui inclut l'en-tête de contournement) en BLOB.
    axios.get(url, { 
      headers: { 'ngrok-skip-browser-warning': 'true' },
      responseType: 'blob' 
    })
      .then(res => {
        if (isMounted) setObjectUrl(URL.createObjectURL(res.data));
      })
      .catch(err => {
        console.error('Erreur chargement avatar:', err);
        if (isMounted) setObjectUrl(url); // Fallback standard
      });

    return () => {
      isMounted = false;
      // Nettoyer l'URL objet pour éviter les fuites mémoire
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (!objectUrl) return <div style={{ ...style, backgroundColor: 'transparent' }} className={className} />;
  
  return <img src={objectUrl} alt={alt || ""} style={style} className={className} />;
}
