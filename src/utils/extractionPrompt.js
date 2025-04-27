export const extractionPrompt = `Extract spirit information from this page. Look for:

1. Name: The full name of the spirit/bottle. This could be in:
   - Product title
   - Heading (h1, h2)
   - Product name field
   - Meta title
   - Any prominent text that appears to be the bottle name

2. Price: The current price of the bottle. Look for:
   - Price tags
   - Currency symbols ($, €, £)
   - Numbers that appear to be prices
   - Sale prices
   - Regular prices
   - Any price-related text

3. Size: The bottle size/volume. Look for:
   - ml, cl, L measurements
   - Volume indicators
   - Size specifications
   - Common sizes like 700ml, 750ml, 1L

4. Type: The type of spirit. Look for:
   - Whisky/Whiskey
   - Bourbon
   - Scotch
   - Rum
   - Gin
   - Vodka
   - Tequila
   - Liqueur
   - Cognac
   - Brandy
   - Other spirit categories

5. ABV: The alcohol by volume percentage. Look for:
   - % ABV
   - Alcohol percentage
   - Proof (divide by 2 to get ABV)
   - Numbers followed by % that appear to be alcohol content

Return the data in this exact JSON format:
{
  "name": "extracted name",
  "price": "extracted price",
  "size": "extracted size",
  "type": "extracted type",
  "abv": "extracted abv"
}

If any field cannot be found, use "unknown" as the value.`; 