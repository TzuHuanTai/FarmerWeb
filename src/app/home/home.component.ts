import { Component, OnInit, AfterContentInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { StationInfo } from '../../interface/greenhouse/station_info';
import { RealtimeWeather } from '../../interface/greenhouse/realtime_weather';
import { environment } from '../../environments/environment';
import { RealtimeService } from '../../api/greenhouse/realtime.service';
import { StationInfoService } from '../../api/greenhouse/station_into.service';
import * as Highcharts from 'highcharts';
require('highcharts/highcharts-more')(Highcharts);
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/export-data')(Highcharts);
// require('highcharts/modules/solid-gauge')(Highcharts);
// require('highcharts/modules/variwide')(Highcharts);
require('highcharts/themes/dark-blue')(Highcharts);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [StationInfoService, RealtimeService]
})

export class HomeComponent implements OnInit, AfterContentInit, OnDestroy {

  // 氣象站台清單、已選取之站台
  stations: StationInfo[];
  timeNow: Observable<string>;
  realtimeData: RealtimeWeather;
  selectedStations: StationInfo = new StationInfo();
  connection = new signalR.HubConnectionBuilder()
    .withUrl(environment.sensorHubUrl)
    .configureLogging(signalR.LogLevel.Information)
    .build();

  // Highchart
  realtimeLux: any;
  realtimeRhGauge: any;
  realtimeTempGauge: any;
  @ViewChild('realtimeLux', { static: true }) realtimeLuxEle: ElementRef;
  @ViewChild('realtimeRhGauge', { static: true }) realtimeRhGaugeEle: ElementRef;
  @ViewChild('realtimeTempGauge', { static: true }) realtimeTempGaugeEle: ElementRef;

  constructor(
    private stationInfoService: StationInfoService,
    private realtimeService: RealtimeService,
  ) {

    // 初始化建立SignalR連線
    this.connection.start().then(() => {
      this.listenWebSocket(this.connection);
    }).catch(err => {
      console.error(err);
    });

    // 抓Station Selector選項
    this.stationInfoService.getStationInfo().subscribe((result: StationInfo[]) => {
      this.stations = result;
      if (this.stations.length > 0) {
        // 預設初始選項為第一個選項
        this.selectedStations = result[0];

        // 得到station id後，馬上初始化即時資料
        this.drawRealtimeData(this.selectedStations.stationId);
      }
    }, error => {
      console.error(error);
    });
  }

  ngOnInit() {
    const options: Intl.DateTimeFormatOptions = {
      // year: "numeric", month: "short", day: "numeric",
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
      // weekday: "short",
    };

    // 直接設定param類型為Observable
    this.timeNow = new Observable<string>((observer: Subscriber<string>) => {
      setInterval(() => observer.next(
        // 反應速度差不多
        new Date().toLocaleTimeString('zh-TW', options)
      ), 1000);
    });

  }

  ngAfterContentInit() {
    // #region 設定Highstock屬性
    const optionsTemp: Highcharts.Options = {
      chart: {
        type: 'gauge',
        plotBackgroundColor: null,
        plotBackgroundImage: null,
        plotBorderWidth: 0,
        plotShadow: false,
        backgroundColor: 'black',
      },
      title: {
        text: 'Realtime Temperature'
      },
      pane: {
        startAngle: -150,
        endAngle: 150,
      },
      // the value axis
      yAxis: {
        min: -10,
        max: 50,

        minorTickInterval: 'auto',
        minorTickWidth: 1,
        minorTickLength: 10,
        minorTickPosition: 'inside',
        minorTickColor: '#666',

        tickPixelInterval: 30,
        tickWidth: 1,
        tickPosition: 'inside',
        tickLength: 15,
        tickColor: '#666',
        labels: {
          step: 2,
          //rotation: 'auto'
        },
        title: {
          text: '°C',
          x: 0,
          y: 180,
          style: {
            fontSize: '20px'
          }
        },
        plotBands: [{
          from: -10,
          to: 15,
          color: '#1E90FF' // blue
        }, {
          from: 15,
          to: 30,
          color: '#55BF3B' // green
        }, {
          from: 30,
          to: 50,
          color: '#DF5353' // red
        }]
      },
      credits: {
        enabled: false
      },
      series: [{
        name: 'Temperature',
        type: 'gauge',
        data: [],
        dataLabels: {
          formatter:
            function () {
              const temp = this.y;
              return '<span style="color:#339;font-size: 16px;">' + temp + ' °C</span><br/>';
            }
        },
        tooltip: {
          valueSuffix: ' °C'
        }
      }]
    };
    const optionsRH: Highcharts.Options = {
      chart: {
        type: 'gauge',
        plotBackgroundColor: null,
        plotBackgroundImage: null,
        plotBorderWidth: 0,
        plotShadow: false,
        backgroundColor: 'black',
      },
      title: {
        text: 'Realtime Humidity'
      },
      pane: {
        startAngle: -150,
        endAngle: 150,
      },
      // the value axis
      yAxis: {
        min: 0,
        max: 100,

        minorTickInterval: 'auto',
        minorTickWidth: 1,
        minorTickLength: 10,
        minorTickPosition: 'inside',
        minorTickColor: '#666',

        tickPixelInterval: 30,
        tickWidth: 1,
        tickPosition: 'inside',
        tickLength: 15,
        tickColor: '#666',
        labels: {
          step: 2,
          //rotation: 'auto'
        },
        title: {
          text: '%',
          x: 0,
          y: 180,
          style: {
            fontSize: '20px'
          }
        },
        plotBands: [{
          from: 0,
          to: 40,
          color: '#1E90FF' // blue
        }, {
          from: 40,
          to: 70,
          color: '#55BF3B' // green
        }, {
          from: 70,
          to: 100,
          color: '#DF5353' // red
        }]
      },
      credits: {
        enabled: false
      },
      series: [{
        name: 'RH',
        type: 'gauge',
        data: [],
        dataLabels: {
          formatter:
            function () {
              const RH = this.y;
              return '<span style="color:#339;font-size: 16px;">' + RH + ' %</span><br/>';
            }
        },
        tooltip: {
          valueSuffix: ' %'
        }
      }]
    };
    const optionsLux: Highcharts.Options = {
      chart: {
        type: 'spline',
        animation: true, // don't animate in old IE
        marginRight: 10,
        backgroundColor: 'black',
      },

      time: {
        useUTC: false
      },

      title: {
        text: 'Realtime Illuminance'
      },
      xAxis: {
        type: 'datetime',
        tickPixelInterval: 15
      },
      yAxis: {
        title: {
          text: 'Lux'
        },
        plotLines: [{
          value: 0,
          width: 1,
          color: '#808080'
        }]
      },
      tooltip: {
        headerFormat: '', // '<b>{series.name}</b><br/>',
        // pointFormat: 'Illuminance: {point.y:.f} lux'
      },
      legend: {
        enabled: false
      },
      exporting: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      series: [{
        name: 'Illuminance',
        type: 'spline',
        data:
          (function () {
            // generate an initial zero data
            const data = [],
              time = (new Date()).getTime();
            for (let i = -199; i <= 0; i += 1) {
              data.push({
                x: time + i * 1000,
                y: 0
              });
            }
            return data;
          }())
      }]
    };
    // #endregion

    // 將基本參數代入，初始化Highchart畫面格式
    this.realtimeTempGauge = Highcharts.chart(this.realtimeTempGaugeEle.nativeElement, optionsTemp);
    this.realtimeRhGauge = Highcharts.chart(this.realtimeRhGaugeEle.nativeElement, optionsRH);
    this.realtimeLux = Highcharts.chart(this.realtimeLuxEle.nativeElement, optionsLux);
  }

  ngOnDestroy() {
    // 關閉SignalR連線
    this.connection.off;
  }

  onSelect(stationId: number) {
    for (let i = 0; i < this.stations.length; i++) {
      if (this.stations[i].stationId === stationId) {
        this.selectedStations = this.stations[i];
      }
    }
    // 切換後馬上初始化即時資料，不等WebSocket慢慢廣播過來
    this.drawRealtimeData(this.selectedStations.stationId);
  }

  private listenWebSocket(connection: signalR.HubConnection) {
    connection.on('SensorDetected', (detectedData: RealtimeWeather) => {
      if (this.selectedStations.stationId === detectedData.stationId) {
        this.realtimeData = detectedData;

        this.realtimeTempGauge.series[0].update({
          data: [detectedData.temperature]
        }, true);

        this.realtimeRhGauge.series[0].update({
          data: [detectedData.rh]
        }, true);

        this.realtimeLux.series[0].addPoint([
          new Date(detectedData.dateFormatted).getTime(), detectedData.lux
        ], true, true);
      }
    });
  }

  private drawRealtimeData(stationId: number) {
    this.realtimeService.getRealtimeData(stationId).subscribe((data: RealtimeWeather) => {
      if (data) {
        this.realtimeData = data;
        this.realtimeRhGauge.series[0].update({ data: [data.rh] }, true);
        this.realtimeTempGauge.series[0].update({ data: [data.temperature] }, true);
      }
    }, (error) => {
      console.log(error);
    });
  }
}
