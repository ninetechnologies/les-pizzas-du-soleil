import React from 'react';

/**
 * Logo Les Pizzas du Soleil — vrai logo fourni par Marie (PNG transparent HD).
 * `size` = cote en px. `inverse` = ombre portee renforcee pour fonds sombres.
 */
export default function Logo({ size = 56, inverse = false }) {
  return (
    <img
      src="/logo.png"
      alt="Les Pizzas du Soleil"
      width={size}
      height={size}
      style={{
        display: 'block',
        width: size,
        height: size,
        objectFit: 'contain',
        filter: inverse
          ? 'drop-shadow(0 3px 8px rgba(0,0,0,0.4))'
          : 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))',
      }}
    />
  );
}
