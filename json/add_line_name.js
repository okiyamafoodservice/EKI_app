const fs = require("fs");

//linenameを追加数r
// line_cdに対応するline_nameを取得する関数
const getLineNames = (lineData) => {
  const lineNames = {};
  lineData.forEach((line) => {
    lineNames[line.line_cd] = line.line_name;
  });
  return lineNames;
};

// JSONファイルの読み込み
fs.readFile("nearStation.json", "utf8", (err, stationData) => {
  if (err) {
    console.error(err);
    return;
  }
  fs.readFile("linedata.json", "utf8", (err, lineData) => {
    if (err) {
      console.error(err);
      return;
    }

    const stations = JSON.parse(stationData);
    const lines = JSON.parse(lineData);
    const lineNames = getLineNames(lines);

    // 各駅データにline_nameを追加
    stations.forEach((station) => {
      const lineCd = station.line_cd;
      if (lineCd in lineNames) {
        station.line_name = lineNames[lineCd];
      }
    });

    // 新しいJSONファイルとして保存
    fs.writeFile(
      "nearStation_with_line_name.json",
      JSON.stringify(stations, null, 4),
      "utf8",
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("line_nameを追加した新しいJSONファイルが作成されました。");
      }
    );
  });
});
