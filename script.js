let stations = [];
let intervalId;
let lastAlertDistance = null;

// nearStation.jsonファイルを読み込み、stations変数に格納
fetch("./json/nearStation_with_line_name.json")
  .then((response) => response.json())
  .then((data) => {
    stations = data.map((station) => ({
      station_name: station.station_name,
      lat: parseFloat(station.lat),
      lon: parseFloat(station.lon),
      line_name: station.line_name,
    }));

    // 駅名をselect要素に追加
    populateLineSelect();
    populateStationSelect();

    // lineSelectの変更イベントを監視してstationSelectを更新
    document
      .getElementById("lineSelect")
      .addEventListener("change", populateStationSelect);
  })
  .catch((error) => console.error("Error loading station data:", error));

document.getElementById("startButton").addEventListener("click", () => {
  const targetStationName = document.getElementById("stationSelect").value;
  const notificationDistance = parseFloat(
    document.getElementById("distanceInput").value
  );

  // 既存のインターバルがある場合はクリア
  if (intervalId) {
    clearInterval(intervalId);
    lastAlertDistance = null; // アラート距離のリセット
  }

  startLocationTracking(targetStationName, notificationDistance);
});

function startLocationTracking(targetStationName, notificationDistance) {
  if ("geolocation" in navigator) {
    intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          handlePositionSuccess(
            position,
            targetStationName,
            notificationDistance
          ),
        handlePositionError,
        { timeout: 5000, maximumAge: 0, enableHighAccuracy: true }
      );
    }, 2000); // 2秒ごとに位置情報を取得
  } else {
    alert("Geolocation is not supported by your browser");
  }
}

function handlePositionSuccess(
  position,
  targetStationName,
  notificationDistance
) {
  const userLocation = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
  };

  console.log(
    `Current position: Lat=${userLocation.lat}, Lon=${userLocation.lon}`
  );

  const targetStation = stations.find(
    (station) => station.station_name === targetStationName
  );

  if (targetStation) {
    const distance = getDistance(userLocation, targetStation);
    console.log(
      `Distance to ${targetStation.station_name}: ${distance.toFixed(3)} km`
    );

    if (
      distance <= notificationDistance &&
      (lastAlertDistance === null || lastAlertDistance > notificationDistance)
    ) {
      showNotification(
        `${
          targetStation.station_name
        }に近づいています！距離: ${distance.toFixed(3)} km`
      );

      showModalDialog(
        `${
          targetStation.station_name
        }に近づいています！距離: ${distance.toFixed(3)} km`
      );

      clearInterval(intervalId); // 2秒ごとクリックも停止
    }
    lastAlertDistance = distance; // アラートが表示されたら距離を更新
  }
}

function handlePositionError(error) {
  console.error("Error getting location", error);
  switch (error.code) {
    case error.PERMISSION_DENIED:
      console.error("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      console.error("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      console.error("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      console.error("An unknown error occurred.");
      break;
  }
}

function getDistance(loc1, loc2) {
  const R = 6371; // 地球の半径（km）
  const dLat = deg2rad(loc2.lat - loc1.lat);
  const dLon = deg2rad(loc2.lon - loc1.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(loc1.lat)) *
      Math.cos(deg2rad(loc2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // 距離（km）
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function showNotification(message) {
  // ブラウザ通知の表示
  if (Notification.permission === "granted") {
    new Notification(message);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(message);
      }
    });
  }
  alert(message);
}

function showModalDialog(message) {
  const dialog = document.getElementById("modalDialog");
  const dialogMessage = dialog.querySelector("p");
  dialogMessage.textContent = message;
  dialog.showModal();
}

function populateLineSelect() {
  const lineSelect = document.getElementById("lineSelect");
  const lines = [...new Set(stations.map((station) => station.line_name))];
  lines.forEach((line) => {
    const option = document.createElement("option");
    option.value = line;
    option.textContent = line;
    lineSelect.appendChild(option);
  });
}

function populateStationSelect() {
  const stationSelect = document.getElementById("stationSelect");
  stationSelect.innerHTML = ""; // 既存のオプションをクリア
  const selectedLine = document.getElementById("lineSelect").value;
  const filteredStations =
    selectedLine === "all"
      ? stations
      : stations.filter((station) => station.line_name === selectedLine);
  filteredStations.forEach((station) => {
    const option = document.createElement("option");
    option.value = station.station_name;
    option.textContent = station.station_name;
    stationSelect.appendChild(option);
  });
}

// モードレスダイアログの設定
const dialog = document.getElementById("modalDialog");
const closeButton = document.getElementById("close");

closeButton.addEventListener("click", () => {
  dialog.close();
});
