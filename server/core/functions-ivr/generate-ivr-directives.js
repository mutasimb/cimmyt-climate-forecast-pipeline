const
  { timeDay } = require("d3-time"),
  { timeFormat } = require("d3-time-format"),
  { range, max } = require("d3-array"),
  
  forecastCodeTransform = code => code === 1
    ? "n" : code === 2
    ? "l" : code === 3
    ? "h" : code === 4
    ? "v" : "",
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

module.exports = data => {
  const provider = data
    .reduce((acc, el) => {
      const
        { outgoing, incoming_afternoon, incoming_midnight } = acc,
        { id, group, forecast } = el,
        [idMale, idFemale] = ['m', 'f']
          .map(gender => `t${group.toLowerCase()}_g${gender}_${id}`),
        dates = range(5)
          .map(el => timeDay.offset(new Date(), el))
          .map(el => +timeFormat("%Y%m%d")(el)),
        characterCodes = forecastToCharacterCodes(forecast, dates);
      return {
        ...acc,
        dates: acc.dates ? acc.dates : {
          outgoing: dates[0],
          incoming_afternoon: dates[0],
          incoming_midnight: dates[1]
        },
        outgoing: [
          ...outgoing,
          ...[idMale, idFemale].map(idGroup => {
            const
              [t, g, l] = idGroup.split("_"),
              directives = [
                `ivr1_intro_${g}_${l}_${(
                  characterCodes.indexOf("h") > -1 | characterCodes.indexOf("v") > -1
                ) && t === "ta" ? "bmddae" : "bmd"}`,
                `ivr_${l}`,
                `ivr_db`,
                `ivr_d${`${dates[1]}`.slice(4)}`,
                `ivr_${characterCodes[0] === characterCodes[1] ? `and` : `ivr_f_${forecast}1`}`,
                `ivr_dc`,
                `ivr_d${`${dates[2]}`.slice(4)}`,
                `ivr_f_${
                  characterCodes
                }${
                  characterCodes[0] === characterCodes[1] ? `1`: `2`
                }${
                  characterCodes[2] !== "n" ? `_2d` : ``
                }`,
              ];
            if((characterCodes.indexOf("h") > -1 | characterCodes.indexOf("v") > -1) && t === "ta") {
              directives.push(`msg4_adv_a_${characterCodes}`);
              if(g === "gf") directives.push(`msg5_adv_b`);
            }
            directives.push(`msg6_outro`);
            directives.push(`msg7_outro`);
          
            return {
              group: idGroup,
              // characterCodes,
              directives: directives
            };
          })
        ],
        incoming_afternoon: [
          ...incoming_afternoon,
          ...[idMale, idFemale].map(idGroup => ({ group: idGroup, directives: "Under construction" }))
        ],
        incoming_midnight: [
          ...incoming_midnight,
          ...[idMale, idFemale].map(idGroup => ({ group: idGroup, directives: "Under construction" }))
        ]
      };
    }, {
      dates: null,
      outgoing: [],
      incoming_afternoon: [],
      incoming_midnight: []
    });
  return {
    provider
  };
}
