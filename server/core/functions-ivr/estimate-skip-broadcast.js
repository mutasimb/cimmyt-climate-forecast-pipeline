const
  { max } = require("d3-array"),

  rainToCase = rain =>
    rain < 5 ? "n"
      : rain < 23 ? "l"
        : rain < 39 ? "h"
          : rain >= 39 ? "v"
            : "",
  forecastToCharacterCodes = rainArr =>
    rainToCase(rainArr[0]) +
    rainToCase(rainArr[1]) +
    rainToCase(max(
      rainArr.length === 4 ? [rainArr[2], rainArr[3]]
        : [rainArr[2], rainArr[3], rainArr[4]]
    ));

module.exports = ({ pastDates, past, today }) => today.map(el => {
  const
    { location: l, rain: rainToday } = el,
    characterCodeToday = forecastToCharacterCodes(rainToday),
    pastSkippedBroadcast = past
      .filter(forecast => forecast.location === l)
      .map(d => ({
        dateBroadcast: d.dateBroadcast,
        characterCode: forecastToCharacterCodes(d.rain),
        skip: d.skip
      })),
    [past1, past2, past3] = pastDates.map(d => pastSkippedBroadcast.find(d1 => d1.dateBroadcast === d));

  return {
    ...el,
    skip: characterCodeToday !== 'nnn' ? false
      : past1.characterCode !== 'nnn' ? false
        : !(past1.skip && past2.skip && past3.skip)
  };
});
