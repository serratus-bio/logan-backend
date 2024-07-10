// # of records processed: 38,865,154  326m38s

import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { createGunzip } from 'node:zlib';

import { XMLParser, escapeCSVValue, msToMS, stringNormalize, warnInline } from '../common/common.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// EXPUNGED attribute_name(s) FROM THE DB
//   'accession location',
//   'Additional_lat_lon',
//   'adjacent_environment',
//   'adlt_chld_subfrg_country',
//   'adlt_chld_targ_subfrag_cntry',
//   'affected area',
//   'allograft location',
//   'alt_elev',
//   'altitud',
//   'altitude',
//   'altitude_note',
//   'altitute',
//   'aquaculture origin',
//   'Area',
//   'area of sampling site',
//   'area_code',
//   'area_sampled',
//   'assigned_from_geo',
//   'AtlasLivingAustralia',
//   'barcode coordinate',
//   'Beach',
//   'bio region',
//   'biogeographic_realm',
//   'Biogeography',
//   'biomaterial_provider',
//   'biopsy_location',
//   'Bioregion',
//   'Biospecimen.location..Extract.',
//   'birch_vicinity',
//   'birth origin',
//   'birthplace',
//   'Body_location',
//   'BodyLocation',
//   'Broad-scale environmental context',
//   'cage_location',
//   'CAL_sites',
//   'capture-c viewpoint',
//   'cat_location',
//   'Catch_FAO',
//   'CCA Site',
//   'cd_location',
//   'census_region',
//   'city_ID',
//   'climatic_zone',
//   'cns subregion',
//   'Coast(C)_Shelf(S)_Offshore(O)',
//   'collected_from',
//   'Collection site',
//   'collection site and cell type',
//   'Collection site/time transplantation',
//   'Collection_area',
//   'collection_landscape',
//   'collection_loc',
//   'Collection_Location',
//   'collection_point',
//   'collection_region',
//   'collection_sample_area',
//   'collection_source',
//   'column_loc',
//   'common_sample_site',
//   'Community State Type',
//   'corrected',
//   'corrected_sample_site',
//   'crc site',
//   'Cruise Station',
//   'culture origin',
//   'Culture origin',
//   'cultured_location',
//   'dam',
//   'Dam',
//   'decimalLatitude',
//   'decimalLongitude',
//   'delivery_place',
//   'derivation location',
//   'Description of sampling area',
//   'destination environmental system',
//   'detailed sample location',
//   'disease location',
//   'dog_location',
//   'drinking_water_at_work_city_bottle_well',
//   'drinking_water_source',
//   'drinking_water_source_city_bottled_well',
//   'dune_zone',
//   'dys broad location',
//   'eco_zone',
//   'economic_region',
//   'Ecoregion Level IV',
//   'elev',
//   'elev_above_water',
//   'Elevation_at_DOC',
//   'elevation_meters',
//   'env_broad_scale',
//   'env_local_scale',
//   'envirnonmental-sample',
//   'environment (featurel)',
//   'environment state',
//   'environmental_conditions',
//   'Environmental_conditions',
//   'environmental_sample',
//   'environmental_site',
//   'environmental-sample',
//   'envrionmental-sample',
//   'es state',
//   'ever_tbi_w_loc',
//   'exact location',
//   'exercise_location',
//   'experiment site',
//   'Experimental Site',
//   'extraction site',
//   'fac-sorting',
//   'Facility',
//   'family_site',
//   'FAO Fishing Area',
//   'Farms',
//   'female state',
//   'Field Sample',
//   'field site',
//   'field_grown_on',
//   'field_location_id',
//   'field_plot',
//   'Field_site',
//   'field_site_name',
//   'filter_location',
//   'FISH origin',
//   'food_dis_point',
//   'food_dis_point_city',
//   'food_source',
//   'food_source_human_food',
//   'food_source_pet_store_food',
//   'forward_barcode_location',
//   'gaplocation',
//   'genome_loc',
//   'Geo',
//   'geo_loc_name_(samled_in_the_wild)',
//   'geo_position',
//   'geodetic_system',
//   'geographic area',
//   'Geographical_region',
//   'GPS N',
//   'gps_coord',
//   'grassland',
//   'grid_location',
//   'grocerystore_restaurant_etc',
//   'growing_site',
//   'habitat',
//   'habitat',
//   'Habitat',
//   'habitat_description',
//   'harvest-site',
//   'hemisphere',
//   'Horizontal_location',
//   'host background',
//   'host site',
//   'host state',
//   'host type_wine',
//   'host_clade_sensu_fukami',
//   'host_delivery',
//   'host_farm',
//   'host_history_of_diarrhea',
//   'host_location',
//   'host_location_sampled',
//   'host_of_host_name',
//   'host_of_insect',
//   'host_Residency_Area',
//   'host_sample_site',
//   'host_site_sampled',
//   'host_taxid',
//   'host_tissue_location',
//   'host_Toxoplasma_gondii',
//   'hspc supporting capacity',
//   'human state',
//   'human vaginal environmental package',
//   'hygienic_area',
//   'ICP Forest country and plot code',
//   'id simple',
//   'IN.OUT',
//   'individual_tag',
//   'injury state',
//   'Interation site',
//   'isola',
//   'isolated-by',
//   'isolation area',
//   'isolation source host associated',
//   'joint location',
//   'Lake Layer',
//   'lake name',
//   'lake_form',
//   'landform',
//   'lat',
//   'Latitude',
//   'latitude_units',
//   'LatLong Information',
//   'Lattitude',
//   'library_location',
//   'Library_Location',
//   'living_place',
//   'Local',
//   'local_class',
//   'local_environmental_context',
//   'local_location_notes',
//   'local_scale_environmental_contex',
//   'localisation',
//   'localization',
//   'Localization',
//   'localization description',
//   'localization details',
//   'LOCATION',
//   'location collected',
//   'location description',
//   'location in column',
//   'Location name',
//   'location of collection',
//   'Location of where sample was taken from environment site',
//   'Location_and_Rep',
//   'Location_Code',
//   'Location_Deployed',
//   'location_in_facility',
//   'location_in_lake',
//   'location_in_microcosm',
//   'location_information',
//   'location_replicates',
//   'Location_Treatment',
//   'locationcode',
//   'locations',
//   'longitdue',
//   'Longitude',
//   'longitude_units',
//   'longitudinal visit',
//   'Mangrove_forest',
//   'map',
//   'Map_location',
//   'material_location',
//   'metadata_PatLocation',
//   'milieu',
//   'name of sample site',
//   'nearest_station',
//   'Nest identity',
//   'Nest_location',
//   'noaa_site',
//   'oil_field',
//   'On-shore/off-shore',
//   'orig_sampleid',
//   'origen of cultured cells',
//   'Origin',
//   'origin before_transfer',
//   'Origin Farm',
//   'origin location',
//   'Origin of isolates',
//   'origin of isolation',
//   'Origin of sample',
//   'origin of the parental plants',
//   'origin of the plant',
//   'origin of_ipscs',
//   'origin site',
//   'Origin_Communities',
//   'ORIGIN_SAMPLE',
//   'Origin_type',
//   'origin1',
//   'original sample id',
//   'originates from',
//   'OutdoorEnvironment',
//   'Outside',
//   'Pacific',
//   'paris classification',
//   'Paris Classification',
//   'participant origin',
//   'passage_history',
//   'patch_location',
//   'patient state',
//   'permafrost state',
//   'physical_specimen_location_specific',
//   'pipe_location',
//   'place of collection',
//   'Plant_seed_origin',
//   'Plate coord',
//   'plate_coordinates',
//   'plate_location',
//   'platelocation',
//   'Plot_loc',
//   'plot_location',
//   'plot_number_within_site',
//   'pond location',
//   'Port',
//   'PostalCode',
//   'pot_soil_species_environment_country',
//   'Practice_Location',
//   'prairie',
//   'prep-site',
//   'reef_region',
//   'Reef_Region',
//   'region characterization',
//   'region isolated',
//   'region name',
//   'region_sampled',
//   'region_targeted',
//   'region-based dissection',
//   'regionre',
//   'regionsubregioncode',
//   'relative_location',
//   'remnant_or_disturbed_site',
//   'ReplicateSpeciesTissueLocality',
//   'republic',
//   'residence',
//   'rhesus monkey origin',
//   'Rice_Field',
//   'river_segment',
//   'roi x coordinate',
//   'sam.loc',
//   'samp_collect_dev',
//   'samp_collect_point',
//   'sample area',
//   'sample collection',
//   'Sample Collection',
//   'sample depth or location',
//   'sample location',
//   'Sample location',
//   'sample origin',
//   'Sample origin',
//   'Sample Origin',
//   'sample port',
//   'sample region',
//   'sample site',
//   'Sample Site',
//   'sample state',
//   'sample_collection',
//   'sample_collection_site',
//   'sample_location_code',
//   'Sample_location_in_relation_to_plant_centre',
//   'Sample_origin',
//   'Sample_Origin',
//   'sample_orignin',
//   'sample_point',
//   'sample_position',
//   'Sample_Region',
//   'Sample_site',
//   'Sample_Site',
//   'sample_site_exact',
//   'sample_title_MDcounty',
//   'Sample-location',
//   'Sample.loc',
//   'Sampled Locations',
//   'sampled_site',
//   'samplelocation',
//   'SampleOrigin',
//   'Samplepoint',
//   'samplesite',
//   'SampleSite',
//   'sampling event',
//   'Sampling event',
//   'Sampling Event',
//   'Sampling location',
//   'sampling point',
//   'Sampling point',
//   'sampling postion',
//   'sampling site',
//   'Sampling site',
//   'Sampling Site',
//   'sampling site for LCM',
//   'Sampling Site ID',
//   'sampling station',
//   'Sampling station',
//   'Sampling Station',
//   'Sampling Zones',
//   'sampling_area',
//   'sampling_expedition',
//   'sampling_place',
//   'sampling_point',
//   'Sampling_point',
//   'Sampling_Point',
//   'sampling_point_description',
//   'Sampling_port',
//   'sampling_site',
//   'Sampling_site',
//   'sampling_site_ID',
//   'sampling_station',
//   'Sampling_station',
//   'SAMPLING_station',
//   'sampling_zone',
//   'Sampling_zone',
//   'SamplingLocation',
//   'SamplingPoint',
//   'samplingstation',
//   'scn subregion',
//   'sd_location',
//   'sd_or_la',
//   'sea_water_level',
//   'section/region',
//   'seq site',
//   'seq_region',
//   'sequenced_region',
//   'sequencing_location_latitude_units',
//   'sequencing_location_longitude_units',
//   'shelf_location',
//   'SITE',
//   'Site and Hole',
//   'Site and replicate',
//   'Site and Replicate',
//   'site characteristic',
//   'Site ID',
//   'site location',
//   'Site name',
//   'Site Number',
//   'site of extraction',
//   'site of isolation',
//   'Site of lesion',
//   'site of_origin',
//   'Site on map',
//   'Site Sampled',
//   'site type',
//   'Site_description',
//   'Site_group',
//   'site_no',
//   'site_nr',
//   'site_of_sample_collection',
//   'site_sampled',
//   'Site_station',
//   'site_taken',
//   'SiteCode',
//   'siteid',
//   'SiteID',
//   'SiteLatitude',
//   'SiteLongitude',
//   'sites',
//   'Sites',
//   'Sites_CAL_1-3mm',
//   'Sites_CAL_4-5mm',
//   'slope_location',
//   'snow cover',
//   'Soil location',
//   'soil origin',
//   'soil region',
//   'soil_origin',
//   'soil_sample_site',
//   'source location',
//   'source region',
//   'source_c',
//   'source_sample',
//   'source_site',
//   'space_typ_state',
//   'Spacial sample location',
//   'spatial location',
//   'spatial position',
//   'spatial_location',
//   'spatialLocation',
//   'Species_location',
//   'specific sample collection location',
//   'specific zone',
//   'specific_location_name',
//   'specific_region',
//   'specimen site',
//   'Stake Location',
//   'state at extraction',
//   'State_at_last_checkup',
//   'station_muc',
//   'stationID',
//   'STNM',
//   'Stock Cohort',
//   'Storage location at NIB',
//   'stream site short name',
//   'stream_location',
//   'stream_system',
//   'Study Site',
//   'study_area',
//   'Study_Site',
//   'study_site_name',
//   'sub region',
//   'sub_location',
//   'Sub-region',
//   'subject_site',
//   'subregion',
//   'Subregion',
//   'Subway_location',
//   'surface water site',
//   'surface_location',
//   'Survey',
//   'swablocation',
//   'target_region',
//   'temperate zone',
//   'tissue harvest site',
//   'title_body_site',
//   'topotype',
//   'transect_location',
//   'TransectBeginDecimalLatitude',
//   'TransectBeginDecimalLongitude',
//   'TransectEndDecimalLatitude',
//   'TransectEndDecimalLongitude',
//   'Transplant_site',
//   'travel_history',
//   'Ulcer_location',
//   'urban_rural',
//   'valley',
//   'Vent field',
//   'vent site',
//   'vineyard',
//   'Vineyard Location',
//   'Vineyard Locations',
//   'vineyard_block',
//   'vineyard1',
//   'virus_state',
//   'visit',
//   'Visit',
//   'visit/collection',
//   'water_source_shared',
//   'waterorigin',
//   'well',
//   'Well',
//   'well_location_relative_to_source',
//   'wellKey',
//   'WGS',
//   'ww_sample_site'

// EXPUNGED attribute_value(s) FROM THE DB (>1,000 on BioAnnotate_BioSample.4.attribute_value.js)
//   A
//   Alinen Mustajärvi
//   B
//   D
//   decimal degrees
//   dermis
//   E
//   east basin
//   Engrafted tumor
//   eth_peg_dsyl_wild
//   feces
//   Feces
//   femur
//   genital fluid
//   hpsun
//   human-vaginal
//   left lateral upper arm
//   liver
//   lymph node
//   lymph node medullary sinus
//   Marine
//   Monkey_Run
//   n/a
//   N/A
//   na
//   NA
//   Nasal cavity
//   neoplasm
//   Nicole Webster
//   normal tissue
//   North
//   not applicable
//   Not applicable
//   Not Applicable
//   not available
//   Not Available
//   not collected
//   Not collected
//   Not Collected
//   not provided
//   NULL
//   pais
//   Pawlowski Lab
//   primitive streak
//   Rectum
//   respiratory tract
//   restricted access
//   SIOpier
//   Stool
//   stratified brackish river anoxic sediment
//   Swine barn
//   Terrestrial
//   Thomas lab
//   true
//   TRUE
//   typical occupied
//   typically occupied
//   UMR CNRS 5557 Ecologie Microbienne
//   uncalculated
//   unk
//   unknown_unknown
//   unspecified
//   Unspecified
//   upper respiratory secretion
//   Urine
//   wastewater treatment plant
//   wound area

const BioSample_all_geo_attribute_names = Object.fromEntries(String(await readFile(join(__dirname, '../data/BioAnnotate_BioSample_all_geo_attribute_names')))
  .split(/\n/)
  .filter(v => !!v)
  .map(stringNormalize)
  .map(v => [v, true]));

const ms = Date.now();
const n = [0, 0];

process.stdout.write(['biosample', 'attribute_name', 'attribute_value'].map(escapeCSVValue).join(',') + '\n');

try {
  await pipeline([
    createReadStream(join(__dirname, '../tmp/biosample_set.xml.gz')),
    createGunzip(),
    XMLParser({ startElement:'BioSample' })
      .on('node', async node => {
        ++n[0];

        const Attribute = node.BioSample?.Attributes?.[0]?.Attribute;
        const Id = node.BioSample?.Ids?.[0]?.Id.find(v => v.$.db === 'BioSample' && v.$.is_primary === '1');

        if(Attribute && Id) {
          for(const attribute of Attribute) {
            const name = Object.entries(attribute.$).find(v => BioSample_all_geo_attribute_names[stringNormalize(v[1])]);
            const value = attribute._?.trim();

            if(name && value) {
              ++n[1];

              process.stdout.write([Id._, attribute.$.harmonized_name||name[1], value].map(escapeCSVValue).join(',') + '\n');
            }
          }
        }

        if(!(n[0]%1024))
          warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + '] ' + msToMS(Date.now()-ms));
      })
  ]);
} catch(e) {
  if(e.code !== 'Z_BUF_ERROR') {
    console.error(e);

    process.exit(1);
  }
}

warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + '] ' + msToMS(Date.now()-ms) + '\n');
