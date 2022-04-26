import React, { useEffect, useState } from "react";
import { Map, Marker, GoogleApiWrapper } from "google-maps-react";

function RentalsMap({ locations, google, setHighLight }) {
  const [center, setCenter] = useState();

  useEffect(() => {
    const avgLat = locations.reduce((a, b) => a + Number(b.lat), 0) / locations.length;
    const avgLng = locations.reduce((a, b) => a + Number(b.lng), 0) / locations.length;
    setCenter({ lat: avgLat.toString(), lng: avgLng.toString() });
  }, [locations]);

  return (
    <>
      {center && (
        <Map
          google={google}
          containerStyle={{
            width: "50vw",
            height: "calc(100vh - 135px)"
          }}
          initialCenter={center || locations[0]}
          zoom={13}
          disableDefaultUI={true}
        >
          {locations.map((coords, i) => (
            <Marker key={i} position={coords} onClick={() => setHighLight(i)} />
          ))}
        </Map>
      )}
    </>
  );
}

export default GoogleApiWrapper({ apiKey: "" })(RentalsMap);
