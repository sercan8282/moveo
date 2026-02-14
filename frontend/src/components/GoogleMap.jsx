export default function GoogleMap({ address, height = '400px', className = '' }) {
  if (!address) return null;

  // Use OpenStreetMap embed via iframe (no API key needed)
  // Also works great with Google Maps embed
  const encodedAddress = encodeURIComponent(address);
  
  // Use Google Maps embed (free, no API key needed for simple embeds)
  const mapUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

  return (
    <div className={`rounded-xl overflow-hidden shadow-lg ${className}`} style={{ height }}>
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Locatie: ${address}`}
      />
    </div>
  );
}
