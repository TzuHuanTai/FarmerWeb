import { Component, OnInit, AfterContentInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { StationInfo } from '../../interface/greenhouse/station_info';
import { RealtimeWeather } from '../../interface/greenhouse/realtime_weather';
import { environment } from '../../environments/environment';
import { RealtimeService } from '../../api/greenhouse/realtime.service';
import { StationInfoService } from '../../api/greenhouse/station_into.service';
import * as Highcharts from 'highcharts';
import { HttpErrorResponse } from '@angular/common/http';
require('highcharts/highcharts-more')(Highcharts);
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/export-data')(Highcharts);
require('highcharts/themes/dark-blue')(Highcharts);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [StationInfoService, RealtimeService]
})

export class HomeComponent implements OnInit, AfterContentInit, OnDestroy {
  stations: StationInfo[];
  selectedStations: StationInfo = new StationInfo();
  humGauge: any;
  tempGauge: any;
  luxGauge: any;
  tempChart: any;
  humiChart: any;
  luxChart: any;
  @ViewChild('tempChart', { static: true }) tempChartEle: ElementRef;
  @ViewChild('humiChart', { static: true }) humiChartEle: ElementRef;
  @ViewChild('luxChart', { static: true }) luxChartEle: ElementRef;
  connection = new signalR.HubConnectionBuilder()
    .withUrl(environment.sensorHubUrl)
    .configureLogging(signalR.LogLevel.Information)
    .build();

  constructor(
    private stationInfoService: StationInfoService,
    private realtimeService: RealtimeService,
  ) {
    this.connection.start().then(() => {
      this.listenWebSocket(this.connection);
    }).catch(err => {
      console.error(err);
    });

    this.stationInfoService.getStationInfo().subscribe({
      next: (result: StationInfo[]) => {
        if (result?.length > 0) {
          this.stations = result;
          this.selectedStations.stationId = result[0].stationId;
          this.drawRealtimeData(this.selectedStations.stationId);
        }
      },
      error: (error: HttpErrorResponse) => console.error(error)
    });
  }

  ngOnInit() {
    this.tempGauge = createVerGauge('temperature', -20, 60, '°C').setVal(0);
    this.humGauge = createRadGauge('humidity', 0, 100, '%').setVal(0);
    this.luxGauge = createSunGauge('illuminance', 'lux').setVal(0);
  }

  ngAfterContentInit() {
    const tempOptions: Highcharts.Options = {
      chart: {
        type: 'spline',
        animation: true,
        backgroundColor: '#424242',
        borderColor: 'gray',
        borderRadius: 10
      },
      time: {
        useUTC: false
      },

      title: {
        text: 'Temperature'
      },
      xAxis: {
        type: 'datetime',
        tickPixelInterval: 60
      },
      yAxis: {
        title: {
          text: '°C'
        },
        plotLines: [{
          value: 0,
          width: 1,
        }]
      },
      tooltip: {
        headerFormat: '',
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
        name: 'Temperature',
        type: 'spline',
        color: '#55BF3B',
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
    const humiOptions: Highcharts.Options = {
      chart: {
        type: 'spline',
        animation: true,
        backgroundColor: '#424242',
        borderColor: 'gray',
        borderRadius: 10,
      },
      time: {
        useUTC: false
      },

      title: {
        text: 'Humidity'
      },
      xAxis: {
        type: 'datetime',
        tickPixelInterval: 60
      },
      yAxis: {
        title: {
          text: '%'
        },
        plotLines: [{
          value: 0,
          width: 1,
        }]
      },
      tooltip: {
        headerFormat: '',
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
        name: 'Humidity',
        type: 'spline',
        color: '#1565C0',
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
    const luxOptions: Highcharts.Options = {
      chart: {
        type: 'spline',
        animation: true,
        backgroundColor: '#424242',
        borderColor: 'gray',
        borderRadius: 10
      },
      time: {
        useUTC: false
      },

      title: {
        text: 'Illuminance'
      },
      xAxis: {
        type: 'datetime',
        tickPixelInterval: 60
      },
      yAxis: {
        title: {
          text: 'Lux'
        },
        plotLines: [{
          value: 0,
          width: 1,
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
        color: '#C68F2D',
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

    this.tempChart = Highcharts.chart(this.tempChartEle.nativeElement, tempOptions);
    this.humiChart = Highcharts.chart(this.humiChartEle.nativeElement, humiOptions);
    this.luxChart = Highcharts.chart(this.luxChartEle.nativeElement, luxOptions);
  }

  ngOnDestroy() {
    this.connection.off;
  }

  onSelect(stationId: number) {
    this.drawRealtimeData(stationId);
  }

  private listenWebSocket(connection: signalR.HubConnection) {
    connection.on('SensorDetected', (data: RealtimeWeather) => {
      if (this.selectedStations.stationId === data.stationId) {
        this.updateGauge(data);

        this.tempChart.series[0].addPoint([
          new Date(data.dateFormatted).getTime(), data.temperature
        ], true, true);
        this.humiChart.series[0].addPoint([
          new Date(data.dateFormatted).getTime(), data.rh
        ], true, true);
        this.luxChart.series[0].addPoint([
          new Date(data.dateFormatted).getTime(), data.lux
        ], true, true);
      }
    });
  }

  private drawRealtimeData(stationId: number) {
    this.realtimeService.getRealtimeData(stationId).subscribe({
      next: (data: RealtimeWeather) => this.updateGauge(data),
      error: (error: HttpErrorResponse) => console.error(error)
    });
  }

  private updateGauge(data: RealtimeWeather) {
    this.tempGauge.setVal(data?.temperature ?? 0);
    if (data?.temperature > 34) {
      this.tempGauge.setColor('#FF0000');
    } else if (data?.temperature > 28) {
      this.tempGauge.setColor('#FF8800');
    } else {
      this.tempGauge.setColor('#55BF3B');
    }
    this.humGauge.setVal(data?.rh ?? 0);
    this.luxGauge.setVal(data?.lux ?? 0);
  }
}

function createRadGauge(id, minVal, maxVal, unit) {
  function polarToCartesian(centerX, centerY, radius, rad) {
    return {
      x: centerX + (radius * Math.cos(rad)),
      y: centerY + (radius * Math.sin(rad))
    };
  }

  function arc(x, y, radius, val, minVal, maxVal) {
    var start = polarToCartesian(x, y, radius, -Math.PI);
    var end = polarToCartesian(x, y, radius, -Math.PI * (1 - 1 / (maxVal - minVal) * (val - minVal)));
    var d = [
      "M", start.x, start.y,
      "A", radius, radius, 0, 0, 1, end.x, end.y
    ].join(" ");
    return d;
  }

  var tmpl =
    '<svg class="rGauge" viewBox="0 0 200 145">' +
    '<path class="rGauge-base" id="' + id + '_base" stroke-width="30" />' +
    '<path class="rGauge-progress" id="' + id + '_progress" stroke-width="30" stroke="#1565c0" />' +
    '<text class="rGauge-val" id="' + id + '_val" x="100" y="105" text-anchor="middle"></text>' +
    '<text class="rGauge-min-val" id="' + id + '_minVal" x="40" y="125" text-anchor="middle"></text>' +
    '<text class="rGauge-max-val" id="' + id + '_maxVal" x="160" y="125" text-anchor="middle"></text>' +
    '</svg>';

  document.getElementById(id).innerHTML = tmpl;
  document.getElementById(id + '_base').setAttribute("d", arc(100, 100, 60, 1, 0, 1));
  document.getElementById(id + '_progress').setAttribute("d", arc(100, 100, 60, minVal, minVal, maxVal));
  document.getElementById(id + '_minVal').textContent = minVal;
  document.getElementById(id + '_maxVal').textContent = maxVal;

  var gauge = {
    setVal: function (val) {
      val = Math.max(minVal, Math.min(val, maxVal));
      document.getElementById(id + '_progress').setAttribute("d", arc(100, 100, 60, val, minVal, maxVal));
      document.getElementById(id + '_val').textContent = String(val ? val : '--') + (unit ? unit : '');
      return gauge;
    },
    setColor: function (color) {
      document.getElementById(id + '_progress').setAttribute("stroke", color);
      return gauge;
    }
  }

  return gauge;
}

function createVerGauge(id, minVal, maxVal, unit) {
  var tmpl =
    '<svg class="vGauge" viewBox="0 0 120 145">' +
    '<rect class="vGauge-base" id="' + id + '_base" x="20" y="25" width="30" height="100"></rect>' +
    '<rect class="vGauge-progress" id="' + id + '_progress" x="20" y="25" width="30" height="0" fill="#1565c0"></rect>' +
    '<text class="vGauge-val" id="' + id + '_val" x="60" y="80" text-anchor="start"></text>' +
    '<text class="vGauge-min-val" id="' + id + '_minVal" x="60" y="125"></text>' +
    '<text class="vGauge-max-val" id="' + id + '_maxVal" x="60" y="30" text-anchor="start"></text>' +
    '</svg>';

  document.getElementById(id).innerHTML = tmpl;
  document.getElementById(id + '_minVal').textContent = minVal;
  document.getElementById(id + '_maxVal').textContent = maxVal;

  var gauge = {
    setVal: function (val: number) {
      val = Math.max(minVal, Math.min(val, maxVal));
      var height = 100 / (maxVal - minVal) * (val - minVal);

      document.getElementById(id + '_progress').setAttribute("height", String(height));
      document.getElementById(id + '_progress').setAttribute("y", String(25 + (100 - height)));
      document.getElementById(id + '_val').textContent = String(val ? val : '--') + (unit ? unit : '');
      return gauge;
    },
    setColor: function (color) {
      document.getElementById(id + '_progress').setAttribute("fill", color);
      return gauge;
    }
  }

  return gauge;
}

function createSunGauge(id, unit) {
  var tmpl =
    '<svg class="vGauge" viewBox="0 0 45 45">' +
    '<g><path style="fill: #c68f2d" d="M31.5 20.5c0 6-4 11-11 11-7 0-11-5-11-11S13.5 9.5 20.5 9.5 31.5 14.5 31.5 20.5z' +
    'M20.5 7.333c.555 0 1-.448 1-1V4c0-.552-.445-1-1-1-.553 0-1 .448-1 1v2.333C19.5 6.885 19.949 7.333 20.5 7.333z' +
    'M20.5 33.667c-.553 0-1 .448-1 1V37c0 .552.447 1 1 1 .555 0 1-.448 1-1v-2.333C21.5 34.115 21.055 33.667 20.5 33.667z' +
    'M37 19.5h-2.334c-.553 0-1 .448-1 1s.447 1 1 1H37c.555 0 1-.448 1-1S37.555 19.5 37 19.5zM7.332 20.5c0-.552-.446-1-1-1' +
    'H4c-.553 0-1 .448-1 1s.447 1 1 1h2.332C6.886 21.5 7.332 21.052 7.332 20.5zM30.52 11.482c.256 0 .512-.098.707-.293l1.771-1.771' +
    'c.392-.391.392-1.024 0-1.414-.392-.391-1.022-.391-1.414 0l-1.771 1.771c-.393.391-.393 1.024 0 1.414C30.006 11.385 30.264 11.482 30.52 11.482z' +
    'M9.776 29.811l-1.771 1.771c-.391.391-.391 1.023 0 1.414.195 .195.451 .293.707 .293s.512-.098.707-.293l1.771-1.771c.392-.39.392-1.021 0-1.414' +
    'C10.799 29.42 10.166 29.42 9.776 29.811zM31.227 29.811c-.393-.391-1.022-.391-1.414 0-.393.392-.393 1.023 0 1.414l1.771 1.771' +
    'c.194.195 .451.293 .707.293s.512-.098.707-.293c.392-.391.392-1.023 0-1.414L31.227 29.811zM9.776 11.189c.195.195 .451.293 .707.293' +
    ' .257 0 .513-.098.707-.293.392-.391.392-1.024 0-1.414L9.419 8.004c-.392-.391-1.023-.391-1.414 0s-.391 1.024 0 1.414L9.776 11.189z' +
    'M24.979 8.119c.113.041 .229.06 .342.06 .408 0 .795-.253.939-.66l1.815-5.015c.188-.519-.082-1.093-.601-1.281-.521-.188-1.094.081-1.281.6l-1.815' +
    ' 5.015C24.191 7.357 24.461 7.931 24.979 8.119zM16.021 32.881c-.521-.188-1.092.081-1.28.6l-1.814 5.017c-.188.521 .08 1.093.6 1.28.113 .041.227' +
    ' .061.34 .061.41 0 .793-.253.941-.66l1.814-5.015C16.808 33.643 16.541 33.068 16.021 32.881zM39.177 26.195 34.16 24.38c-.518-.188-1.092.081-' +
    '1.279.601s.08 1.094.602 1.28l5.017 1.815c.11.041 .228.06 .34.06 .408 0 .793-.253.938-.659C39.963 26.957 39.695 26.383 39.177 26.195z' +
    'M1.826 14.805 6.84 16.62c.113.041 .227.06 .34.06 .41 0 .793-.253.941-.66.188-.52-.082-1.093-.603-1.281l-5.015-1.815c-.518-.187-1.092.081-1.28.6' +
    'C1.037 14.043 1.306 14.617 1.826 14.805zM32.422 14.914c.171.363 .531.576 .906.576 .145 0 .287-.03.424-.095l4.83-2.263c.5-.234.715-.83.48-1.33-' +
    '.235-.5-.828-.716-1.33-.481l-4.83 2.263C32.402 13.818 32.188 14.414 32.422 14.914zM8.578 26.086c-.232-.5-.828-.715-1.328-.48l-4.83 2.264c-.502.232-' +
    '.717.83-.482 1.33.17 .361.531 .574.906 .574.143 0 .287-.028.424-.094l4.83-2.263C8.597 27.182 8.812 26.586 8.578 26.086zM27.416 32.904' +
    'c-.232-.5-.83-.715-1.33-.481-.5.234-.715.83-.479 1.33l2.263 4.829c.17.363 .53.576 .905.576 .144 0 .287-.03.425-.094.5-.234.715-.83.479-1.33' +
    'L27.416 32.904zM13.584 8.096c.17.363 .529.576 .906.576 .141 0 .285-.03.424-.095.5-.234.715-.83.48-1.33L13.13 2.418c-.234-.499-.828-.716-1.33-.481-' +
    '.5.234-.715.83-.48 1.33L13.584 8.096z"/></g>' +
    '<text class="rGauge-val" id="' + id + '_val" x="20.5" y="21" text-anchor="middle"></text>' +
    '<text class="rGauge-val" id="unit" x="20.5" y="27" text-anchor="middle">' + unit + '</text>' +
    '</svg>';

  document.getElementById(id).innerHTML = tmpl;

  var gauge = {
    setVal: function (val: number) {
      document.getElementById(id + '_val').textContent = String(val ? val : '--');
      return gauge;
    },
    setColor: function (color) {
      document.getElementById(id + '_progress').setAttribute("fill", color);
      return gauge;
    }
  }

  return gauge;
}