# Tasador CABA – Next.js (barrio automático + precio real/m²)

- **Barrio por dirección** vía USIG (API oficial GCBA).
- **Precio/m² por barrio** (usados, 1/2/3 ambientes) desde **IDECBA/GCBA** (base Argenprop), leyendo el XLSX del **último período**.
- **UI profesional**, responsive, botón WhatsApp con tu número (`+5491158107778`).

## Cómo correr
1. `npm install`
2. `npm run dev` → http://localhost:3000
3. Deploy en Vercel (auto-detecta Next.js).

## Dónde está la lógica de datos
- `/api/barrio?direccion=` → llama a USIG y devuelve `{ barrio, comuna }`.
- `/api/valor-m2?barrio=&amb=` → entra a IDECBA, detecta el XLSX del indicador (según ambientes), descarga y lee el **valor más reciente** para ese barrio.

> Nota: IDECBA publica varios indicadores por barrio/ambientes. El código usa **usados por barrio** para 1, 2 y 3 ambientes.
