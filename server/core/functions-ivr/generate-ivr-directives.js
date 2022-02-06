const
  fs = require('fs'),
  { promisify } = require('util'),
  readFile = promisify(fs.readFile),

  { timeDay } = require("d3-time"),
  { timeFormat } = require("d3-time-format"),
  { range, max } = require("d3-array"),

  { pathMungbean } = require('../../config/keys.js'),

  isEmpty = obj => Object.keys(obj).length === 0 && obj.constructor === Object,
  forecastCodeTransform =
    code => code === 1 ? "n"
      : code === 2 ? "l"
        : code === 3 ? "h"
          : code === 4 ? "v"
            : "",
  forecastToCharacterCodes = (forecast, dates) => {
    const codes = forecast
      .filter(el => dates.indexOf(el.date) > 0)
      .map(el => el.code);
    return [
      forecastCodeTransform(codes[0]),
      forecastCodeTransform(codes[1]),
      forecastCodeTransform(max([
        codes[2], codes[3], codes[4]
      ]))
    ].join("")
  };

module.exports = data => new Promise(async (resolve, reject) => {
  const
    mungbeanDirectiveJSONs = range(4)
      .map(el => timeDay.offset(new Date(), el * (-1)))
      .map(el => pathMungbean + '/' + timeFormat("bmd_forecast_ivr_%Y%m%d_d01.json")(el));

  const
    dataArchiveJSON1 = fs.existsSync(mungbeanDirectiveJSONs[1]) ? JSON.parse(await readFile(mungbeanDirectiveJSONs[1])) : {},
    dataArchiveJSON2 = fs.existsSync(mungbeanDirectiveJSONs[2]) ? JSON.parse(await readFile(mungbeanDirectiveJSONs[2])) : {},
    dataArchiveJSON3 = fs.existsSync(mungbeanDirectiveJSONs[3]) ? JSON.parse(await readFile(mungbeanDirectiveJSONs[3])) : {};

  const processedData = data
    .reduce((acc, el, i) => {
      const
        { outgoing, incoming } = acc,
        { id, dis, upz, unn, group, forecast } = el,
        [idMale, idFemale] = ['m', 'f']
          .map(gender => `t${group.toLowerCase()}_g${gender}_${id}`),
        dates = range(5)
          .map(el => timeDay.offset(new Date(), el))
          .map(el => +timeFormat("%Y%m%d")(el)),
        characterCodes = forecastToCharacterCodes(forecast, dates),
        returnableOutgoing = [idMale, idFemale].map(idGroup => {
          const
            [t, g, l] = idGroup.split("_"),
            directives = [
              `ivr1_intro_${g}_${l}_${(
                characterCodes.indexOf("h") > -1 | characterCodes.indexOf("v") > -1
              ) && t === "ta" ? "bmddae" : "bmd"}`,
              `ivr_${l}`,
              `ivr_db`,
              `ivr_d${`${dates[1]}`.slice(4)}`,
              `ivr_${characterCodes[0] === characterCodes[1] ? `and` : `f_${characterCodes}1`}`,
              `ivr_dc`,
              `ivr_d${`${dates[2]}`.slice(4)}`,
              `ivr_f_${characterCodes
              }${characterCodes[0] === characterCodes[1] ? `1` : `2`
              }${characterCodes[2] !== "n" ? `_2d` : ``
              }`,
            ];
          if ((characterCodes.indexOf("h") > -1 | characterCodes.indexOf("v") > -1) && t === "ta") {
            directives.push(`msg4_adv_a_${characterCodes}`);
            if (g === "gf") directives.push(`msg5_adv_b`);
          }
          directives.push(`msg6_outro`);
          directives.push(`msg7_outro`);

          let skipBroadcast = false;
          if (!isEmpty(dataArchiveJSON1) && !isEmpty(dataArchiveJSON2) && !isEmpty(dataArchiveJSON3)) {
            if (characterCodes === 'nnn') {
              const
                groupObj1 = dataArchiveJSON1.outgoing.find(groupObj => groupObj.group === idGroup),
                groupObj2 = dataArchiveJSON2.outgoing.find(groupObj => groupObj.group === idGroup),
                groupObj3 = dataArchiveJSON3.outgoing.find(groupObj => groupObj.group === idGroup);
              skipBroadcast = true;

              if (groupObj1.forecastCode !== 'nnn' || (
                'skipBroadcast' in groupObj1 && groupObj1.skipBroadcast === true &&
                'skipBroadcast' in groupObj2 && groupObj2.skipBroadcast === true &&
                'skipBroadcast' in groupObj3 && groupObj3.skipBroadcast === true
              )) skipBroadcast = false;
            }
          }

          return {
            group: idGroup,
            district: dis,
            upazila: upz,
            union: unn,
            forecast: forecast.map(d => ({ date: d.date, rainfall: d.rainfall })),
            forecastCode: characterCodes,
            directives,
            skipBroadcast
          };
        }),
        returnableIncoming = [idMale, idFemale].map(idGroup => {
          const
            [t, g, l] = idGroup.split("_"),
            directives = [
              `ivr1_intro_${g}_incoming`,
              `ivr1_intro2_bmd_forecast_incoming`,
              `ivr_${l}`,
              `ivr_db`,
              `ivr_d${`${dates[1]}`.slice(4)}`,
              `ivr_${characterCodes[0] === characterCodes[1] ? `and` : `f_${characterCodes}1`}`,
              `ivr_dc`,
              `ivr_d${`${dates[2]}`.slice(4)}`,
              `ivr_f_${characterCodes
              }${characterCodes[0] === characterCodes[1] ? `1` : `2`
              }${characterCodes[2] !== "n" ? `_2d` : ``
              }`,
            ];
          if ((characterCodes.indexOf("h") > -1 | characterCodes.indexOf("v") > -1) && t === "ta") {
            directives.push(`msg4_adv_a_${characterCodes}`);
            if (g === "gf") directives.push(`msg5_adv_b`);
          }
          directives.push(`msg6_outro`);
          directives.push(`ivr123_thanks`);

          return {
            group: idGroup,
            district: dis,
            upazila: upz,
            union: unn,
            forecast: forecast.map(d => ({ date: d.date, rainfall: d.rainfall })),
            forecastCode: characterCodes,
            directives
          };
        });

      return {
        ...acc,
        dates: acc.dates ? acc.dates : {
          outgoing: dates[0],
          incoming: dates[0]
        },
        outgoing: [
          ...outgoing,
          ...returnableOutgoing
        ],
        incoming: [
          ...incoming,
          ...returnableIncoming
        ]
      };
    }, {
      dates: null,
      outgoing: [],
      incoming: []
    });
  resolve(processedData);
});
