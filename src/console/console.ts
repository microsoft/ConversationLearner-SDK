process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');
import { BlisClient } from '../client/client'
import { ConsoleBase } from './consoleBase'
import { Entity, TakeTurnResponse, TakeTurnModes } from '../client/Model/TakeTurnResponse'
import { TakeTurnRequest } from '../client/Model/TakeTurnRequest'

export class Console extends ConsoleBase {
    
    protected async CreateClient() : Promise<void> 
    {
        this.blisclient = new BlisClient("http://dialog.centralus.cloudapp.azure.com/", "ccastro@microsoft.com", "002a6a39-7ae3-49f5-a737-baf289d44f6f");

        // Create App
        this.appId = await this.blisclient.CreateApp("Test1", "e740e5ecf4c3429eadb1a595d57c14c5");

        // Create location, datetime and forecast entities
        var locationEntityId = await this.blisclient.AddEntity(this.appId, "location", "LUIS", "geography");
        var datetimeEntityId = await this.blisclient.AddEntity(this.appId, "date", "LUIS", "datetime");
        var forecastEntityId = await this.blisclient.AddEntity(this.appId, "forecast", "LOCAL", null);

        this.entityName2Id = 
        {
            'location' : locationEntityId,
            'date' : datetimeEntityId,
            'forecast' : forecastEntityId
        }

        // Create actions
        var whichDayActionId = await this.blisclient.AddAction(this.appId, "Which day?", new Array(), new Array(datetimeEntityId), null);
        var whichCityActionId = await this.blisclient.AddAction(this.appId, "Which city?", new Array(), new Array(locationEntityId), null);
        var forecastActionId = await this.blisclient.AddAction(this.appId, "$forecast", new Array(forecastEntityId), new Array(), null);

        // Train model
        this.modelId = await this.blisclient.TrainModel(this.appId);

        // Create session
        this.sessionId = await this.blisclient.StartSession(this.appId, this.modelId);
    }


    protected LUCallback (text: String, luisEntities : [{}]) : TakeTurnRequest 
    {
        // parse luisEntities into u
        let resolvedEntities = {}

        // resolve 'today' and 'tomorrow' correctly if LUIS misses them
        // (this illustrates how LU behavior can be modified in code)
        if (text.indexOf('today'))
        {
            let date = new Date();
            let datestring = `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`;
            let newEntity =
            {
                'type': 'builtin.datetime.date',
                'entity': 'today',
                'resolution': {
                    'date': datestring
                }
            };
            luisEntities.push(newEntity);
        }
        else if (text.indexOf('tomorrow'))
        {
            let date = new Date();
            date.setDate(date.getDate() + 1);
            let datestring = `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`;
            let newEntity = 
            {
                'type': 'builtin.datetime.date',
                'entity': 'tomorrow',
                'resolution': {
                    'date': datestring
                }
            };
            luisEntities.push(newEntity);
        }

        // Extract date/time
        for (let i=0;i<luisEntities.length;i++)
        {
            let entity = luisEntities[i]; 
            if (entity['type'] == 'builtin.datetime.date')
            {
                resolvedEntities['date.resolution'] = entity['resolution']['date']
                resolvedEntities['date'] = entity['entity'];
            }
            else if (entity['type'] == 'builtin.datetime.time')
            {
                let regex = /\d\d\d\d-\d\d-\d\d'/;
                let match = entity['resolution']['time'].match(regex);
                if (match)
                {
                    resolvedEntities['date.resolution'] = match[0];
                    resolvedEntities['date'] = entity['entity']
                }
            }
        }

        // location  
        let locationEntities = []             
        for (let i=0;i<luisEntities.length;i++)
        {
            let entity = luisEntities[i];
            if (entity['type'] && entity['type'].startsWith('builtin.geography'))
            {
                let start = entity['startIndex']
            /*    if (!(entity in locationEntities))
                {
                    locationEntities.push(entity);
                }*/
            }
        } 

        return new TakeTurnRequest({text : text, entities: luisEntities});
/*

        let locations = []; // LARS TODO [ x['entity'] for x in sorted(location_ents,key=lambda y: y['startIndex']) ]
        let locationString = null;
        if (locations.lenght()>0) {
            locationString = ' '.join(locations)
        }
        else if (self.prev_action == 'Which city?' && luisEntities.length() == 0 && text.length() > 0)
        {
            locationString = text;
        }
        else
        {
            locationString = null
        }
        if (locationString != null)
        {
            resolvedEntities['location'] = locationString;
            let resolvedLocation = self._ingest_location_str(locationString);
            if (resolvedLocation == null) {
                resolvedEntities['location.cant_parse'] = locationString;
                if ('location.resolution' in self.hist)
                {
                    del self.hist['location.resolution'];
                    del self.hist['location.lat_lon'];
                }
            else 
            {
                let [name,lat,lon] = resolvedLocation;
                resolvedEntities['location.resolution'] = name;
                resolvedEntities['location.lat_lon'] = ','.join([lat,lon]);
            }
        }

        # 
        # update state with resolved entities
        #
        self.hist.update(resolvedEntities)

        #
        # retrieve weather forecast
        #        
        if 'forecast' in self.hist:
            del self.hist['forecast']
        if 'location.resolution' in self.hist and 'date.resolution' in self.hist:
            # http://api.wunderground.com/api/9a0ba490019b90d5/forecast/q/seattle.json
            m = re.search('(\d\d\d\d)-(\d\d)-(\d\d)',self.hist['date.resolution'])
            if m != None:
                year = int(m.group(1))
                month = int(m.group(2))
                day = int(m.group(3))
                #print('Year={}, month={}, day={}'.format(year,month,day))
                url = self.wund_url_2 + '/forecast/q/' + self.hist['location.lat_lon'] + '.json'
                if url in self.weather_cache:
                    j = self.weather_cache[url]
                else:
                    r = requests.get(url)
                    try:
                        j = r.json()['forecast']['simpleforecast']['forecastday']
                    except Exception as e:
                        raise Exception("Could not retrieve the weather\nException: {}\nJSON respnse: {}".format(e,json.dumps(r.json(),indent=2)))
                    cache_val = []
                    for entry in j:
                        cache_entry = {
                            'date': {
                                'year': entry['date']['year'],
                                'month': entry['date']['month'],
                                'day': entry['date']['day'],
                                'weekday': entry['date']['weekday'],
                            },
                            'conditions': entry['conditions'],
                            'high': entry['high'],
                            'low': entry['low'],
                        }
                        cache_val.append(cache_entry)
                    self.weather_cache[url] = cache_val
                    #with open('weather.log.json','w') as f:
                    #    json.dump(self.weather_cache,f)
                    #print('WUND RESULT: {}'.format(j))
                try:
                    for entry in j:
                        #print(json.dumps(entry,indent=2))
                        if entry['date']['year'] == year and \
                           entry['date']['month'] == month and \
                           entry['date']['day'] == day:
                            self.hist['forecast'] = \
                                'In {} on {} it will be {} with a high of {} and a low of {}.'.format(
                                    self.hist['location.resolution'],entry['date']['weekday'],
                                    entry['conditions'],entry['high']['fahrenheit'],entry['low']['fahrenheit'])
                            break
                    else:
                        raise Exception("I don't have access to the forecast for {} in {}.".format(
                            self.hist['date'],self.hist['location.resolution']))
                except Exception as e:
                    self.hist['forecast'] = "Sorry, I wasn't able to retrieve the weather\nException: {}\nJSON respnse: {}".format(e,json.dumps(j,indent=2))

        entities = [ self.entname2id[ent] for ent in ['location','date','forecast'] if ent in self.hist ]
        context = {}
        action_mask = []
                    
        return entities,context,action_mask*/
    }
}

new Console().Run();