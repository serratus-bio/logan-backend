# data

### BioAnnotate_BioSample_all_geo_attribute_names

List of attribute_name(s) that was compiled from:

 * The [BioAnnotate](https://github.com/ababaian/BioAnnotate) attributes
   that were tagged as having either a *geo_name* or *geo_coord*.
 * The attribute_name(s) that were identified as candidates for having data
   related to geographical features by OpenAI.

   Model: ```gpt-35-turbo (0613)```
   
   Prompt:
   *The user will provide the name of an attribute, taken from the NCBI BioSample database. You have to infer if this attribute could be used to describe a geographical location from the name alone. If it describes a geographical location, answer "YES"; otherwise answer "NO". Please only answer "YES" or "NO" and nothing else.*

### worldcities.csv

List of city and country names used by the BioSample attribute_value classifier. Creative Commons Attribution 4.0 license.

Attrbution: [https://simplemaps.com/data/world-cities](https://simplemaps.com/data/world-cities)

### WWF_TEW

ESRI Shapefile(s) (.dbf and .shp) with boundaries for the Terrestrial Ecoregions of the World project by the WWF.

Source: [https://www.worldwildlife.org/publications/terrestrial-ecoregions-of-the-world](https://www.worldwildlife.org/publications/terrestrial-ecoregions-of-the-world)
