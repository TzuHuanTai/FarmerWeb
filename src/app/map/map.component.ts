import { Component, HostListener, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import L from 'leaflet';
import { GeoSearchControl, EsriProvider } from 'leaflet-geosearch';
require('leaflet.markercluster');

const icon = new URL( 'leaflet/dist/images/marker-icon.png', import.meta.url);
const iconShadow = new URL( 'leaflet/dist/images/marker-shadow.png', import.meta.url);
const blueIcon = new URL( '../../icon/blue.png', import.meta.url);
const pinkIcon = new URL( '../../icon/pink.png', import.meta.url);
import * as GEOdata from '../../geojson/custom.geo.json';

import { DialogSupplyChainCreateComponent } from './dialog/dialog-supplychain-create.component';
import { DialogSupplyChainDeleteComponent } from './dialog/dialog-supplychain-delete.component';
import { v34 } from '../../api/ApiKmv/v34';
// import { V34Service } from '../ApiKmv/v34.service';
import { WindowService } from './windows/window.service';
import { MapService } from './map.service';
import { startWith } from '../../../node_modules/rxjs/operators';

/** jquery有時候不太穩定，同樣的程式碼有時候讀得到有時候讀不到
 * 解法：設定TimeOut，等所有dom準備完畢再上場
 * 結論：不爽用！
 * declare var $: any;
 * import 'jquery-ui/ui/widgets/draggable.js';
*/

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css'],
    providers: [WindowService, MapService]
})

export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
    // mat-slider
    maxZoom = 18;
    minZoom = 3;
    step = 0.25;
    thumbLabel = true;
    initZoom = 5;
    Zoom = 5;
    vertical = true;

    // mat-sidenav
    @ViewChild('drawer', { static: true }) drawer: any;
    drawerPage: number;
    opened = false;
    subSideChange: Subscription;
    subWindowClose: Subscription;

    sideSwitchButtonList: SwitchButton[] = [
        { name: '供應商/客戶', value: 1 },
        { name: 'Test', value: 2 }
    ];
    windowList: Window[] = [
        { name: 'dragChart', value: 0, opened: true, icon: 'assessment' },
        { name: 'dragAction', value: 1, opened: true, icon: 'vertical_split' },
        { name: 'dragWindow1', value: 2, opened: false, icon: 'work' },
        { name: 'dragWindow2', value: 3, opened: false, icon: 'domain' },
        { name: 'dragWindow3', value: 4, opened: false, icon: 'assignment' }
    ];

    // leaflet
    map: any;
    worldGeoJson: any;
    infoControl: any;
    slideControl: any;

    constructor(public dialog: MatDialog, public windowService: WindowService, public mapService: MapService) {

        // 隱藏footer，調整map顯示於全屏
        const pushElement = document.getElementsByClassName('push');
        (pushElement[0] as HTMLElement).style.display = 'none';
        const wrapperElement = document.getElementsByClassName('wrapper');
        (wrapperElement[0] as HTMLElement).style.display = 'contents';
        const contentElement = document.getElementsByClassName('content');
        (contentElement[0] as HTMLElement).style.display = 'contents';

        // 事件：視窗大小變換時，leaflet的size一起變動
        window.onresize = (event: any) => {
            // 變動時sidenav為關閉狀態，以免css被影響
            this.opened = false;
            this.resizeToScreen(document.getElementById('MapDiv'), 56);
            this.resizeToScreen(document.getElementById('MapDetail'), 56);
        };

    }

    ngOnInit() {
        // leaflet size 初始化
        this.resizeToScreen(document.getElementById('MapDiv'), 56);
        this.resizeToScreen(document.getElementById('MapDetail'), 56);

        // 訂閱sidenav開啟/關閉事件
        this.subSideChange = this.windowService.sideChangeEmitted$.subscribe((emittedId: number) => {
            this.onToggle(emittedId);
        });

        // 訂閱window開啟/關閉事件
        this.subWindowClose = this.windowService.windowCloseEmitted$.subscribe((emittedIndex: number) => {
            this.windowList[emittedIndex].opened = !this.windowList[emittedIndex].opened;

            // 刷新button active class
            this.dockButtomActive();
        });

    }

    ngAfterViewInit() {
        // 建立地圖
        this.createMap();

        // 初始化dock button 開啟/關閉狀態的class以調整css
        // 必須在ngAfterViewInit，等*ngFor完成buttom
        this.dockButtomActive();
    }

    ngOnDestroy() {
        // 回復footer隱藏特例
        const pushElement = document.getElementsByClassName('push');
        (pushElement[0] as HTMLElement).style.display = '';
        const wrapperElement = document.getElementsByClassName('wrapper');
        (wrapperElement[0] as HTMLElement).style.display = '';
        const contentElement = document.getElementsByClassName('content');
        (contentElement[0] as HTMLElement).style.display = '';

        // 取消onresize map
        window.onresize = null;

        // 取消訂閱避免memory leak
        this.subSideChange.unsubscribe();
        this.subWindowClose.unsubscribe();
    }

    createMap() {
        // 建立 Leaflet 地圖，it must create after component is rendered, or Map container would not found
        // 要明確丟入event(e)，不然function內的this會是event而不是global
        //  var self = this;

        // 有bug需手動抓，Webpack在leaflet Icon圖案_getIconUrl抓預設圖案url時字串有問題
        // https://github.com/Leaflet/Leaflet/issues/4968

        // #region Icon設定
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconUrl: icon,
            shadowUrl: iconShadow,
        });
        const customIcon = L.icon({
            iconUrl: blueIcon,
            iconAnchor: [24, 48]
        });
        const vendorIcon = L.icon({
            iconUrl: pinkIcon,
            iconAnchor: [24, 48]
        });
        // #endregion

        // #region 設定底圖與圖層來源
        const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const positronUrl = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
        const antiqueUrl = 'https://cartocdn_{s}.global.ssl.fastly.net/base-antique/{z}/{x}/{y}.png';
        const ecoUrl = 'https://cartocdn_{s}.global.ssl.fastly.net/base-eco/{z}/{x}/{y}.png';

        const option = {
            minZoom: this.minZoom,
            maxZoom: this.maxZoom,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> \
                            contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        };

        const osm = new L.TileLayer(osmUrl, option);
        const positron = new L.TileLayer(positronUrl, option);
        const antique = new L.TileLayer(antiqueUrl, option);
        const eco = new L.TileLayer(ecoUrl, option);

        // 匯入GeoJSON世界地圖檔
        // this.worldGeoJson = new L.geoJson(GEOdata, {
        //     style: (feature) => {
        //         return {
        //             weight: 2,
        //             opacity: 1,
        //             color: '#FED976',
        //             fillColor: '#ADFF2F',
        //             dashArray: '8',
        //             fillOpacity: 0.1
        //         };
        //     },
        //     onEachFeature: (feature, layer) => {
        //         this.onEachFeature(feature, layer);
        //     }
        // });
        // #endregion

        // #region Markers、多邊形標籤
        const myLand = L.polygon([
            [25.272156, 121.492556],
            [25.272322, 121.492739],
            [25.271947, 121.493200],
            [25.271692, 121.492967],
            [25.271950, 121.492656]
        ],
            {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5   // 透明度
            }
        )// .addTo(this.map)
            .bindPopup('三芝的地就沒碰到路呀...<br>荒涼~');
        // .openPopup();

        // 自訂標籤
        const clusterMarkers = L.markerClusterGroup({
            spiderLegPolylineOptions: {
                weight: 5, color: '#222', opacity: 0.5
            },
            // iconCreateFunction: (cluster)=> {
            //     return L.divIcon({ html: '<b>' + cluster.getChildCount() + '</b>' });
            // }
        });
        // var MyMarker1 = L.marker([25.272156, 121.492556]).bindPopup('1'),
        //     MyMarker2 = L.marker([25.272322, 121.492739]).bindPopup('2'),
        //     MyMarker3 = L.marker([25.271947, 121.493200]).bindPopup('3'),
        //     MyMarker4 = L.marker([25.271692, 121.492967]).bindPopup('4'),
        //     MyMarker5 = L.marker([25.271950, 121.492656]).bindPopup('5');
        // //var Markers = L.layerGroup([MyMarker1, MyMarker2, MyMarker3, MyMarker4,MyMarker5]);
        // ClusterMarkers.addLayer(MyMarker1);
        // ClusterMarkers.addLayer(MyMarker2);
        // ClusterMarkers.addLayer(MyMarker3);
        // ClusterMarkers.addLayer(MyMarker4);
        // ClusterMarkers.addLayer(MyMarker5);

        // 初始化客戶/供應商於地圖上


        // 監聽「客戶/供應商」drawer Filter事件，連動地圖Marker項目
        this.mapService.companyFilterEmitted$.subscribe((result: v34[]) => {
            clusterMarkers.clearLayers();
            result.filter(x => x.v3435 !== null && x.v3436 !== null).forEach((v, i, a) => {
                let CompanyIcon;
                if (v.v3404 === 1) {
                    // custom
                    CompanyIcon = customIcon;
                } else if (v.v3404 === 2) {
                    // vendor
                    CompanyIcon = vendorIcon;
                }

                const Marker = L.marker(
                    [v.v3435, v.v3436],
                    {
                        zIndexOffset: 2000, // let marker on the top level
                        icon: CompanyIcon,
                        draggable: 'true'
                    }
                ).bindPopup(
                    v.v3402,
                    { closeButton: false, offset: L.point(0, -20) }
                );
                Marker.on('mouseover', function (e) {
                    this.openPopup();
                });
                Marker.on('mouseout', function (e) {
                    this.closePopup();
                });
                Marker.on('dragstart', function (e) {
                    console.log(v.v3435, v.v3436);
                    console.log(e);
                });
                Marker.on('dragend', function (e) {
                    console.log(v.v3435, v.v3436);
                    console.log(e);
                    e.target.setLatLng([v.v3435, v.v3436]);
                });

                clusterMarkers.addLayer(Marker);
            });
        });
        // 監聽「客戶/供應商」drawer項目被點擊時，地圖飛躍到該點
        this.mapService.drawerDetailClickEmitted$.subscribe((result: number[]) => {
            this.map.panTo(result);
        });

        // #endregion

        // #region 建立map於HTML div後，設定map相關屬性及監聽!
        // 圖層設定
        const baseMaps = {
            'OpenStreetMap': osm,
            'Positron': positron,
            'Antique': antique,
            'Eco': eco
        };
        // const overlayMaps = {
        //     'Countries': this.worldGeoJson,
        //     'MyLand': myLand,
        //     'Cluster': clusterMarkers
        // };

        // 設定經緯度座標等初始值，匯入html div中
        this.map = L.map('MapDiv', {
            zoomSnap: this.step,
            worldCopyJump: false,
            layers: [osm, clusterMarkers],
            maxBounds: [
                [-90, -180],
                [90, 180]
            ],
            maxBoundsViscosity: 1.0
        });
        // 取消雙擊放大地圖
        this.map.doubleClickZoom.disable();

        // 設定初始中心為Taiwan
        this.map.setView(new L.LatLng(23.6, 120.90), this.initZoom);

        // 加入圖層控制項
        //L.control.layers(baseMaps, overlayMaps).addTo(this.map);
        L.control.layers(baseMaps).addTo(this.map);

        // 加入Esri地圖搜尋功能(google的要收錢)
        const provider = new EsriProvider();
        const searchControl = new GeoSearchControl({
            provider: provider,
        });
        this.map.addControl(searchControl);

        // 監聽map是否正在調整Zoom
        this.map.on({
            zoom: () => {
                this.Zoom = this.map.getZoom();
                // console.log(this.map);
                // this.map.setMaxBounds(this.map.getBounds());

            },
            dblclick: (e) => {
                // 滑鼠座標點擊位置
                const data: v34 = new v34();
                data.v3435 = e.latlng.lat;
                data.v3436 = e.latlng.lng;

                this.openCreateDialog(data);
            },
            // mousemove: (e) => {
            //     console.log(e.latlng);
            // }
        });
        // #endregion

        // #region 其他自訂Legend Control append on map
        this.infoControl = L.control({ position: 'bottomright' });
        this.slideControl = L.control({ position: 'topleft' });

        this.infoControl.onAdd = function (map) {
            // 這裡this為map
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            L.DomEvent.disableClickPropagation(this._div);
            const draggable = new L.Draggable(this._div);
            draggable.enable();
            this.update();
            return this._div;
        };

        // method that we will use to update the control based on feature properties passed
        this.infoControl.update = function (props) {
            this._div.innerHTML = '<div><h4>Information of the country</h4>' + (props ?
                '<b>' + props.name + '</b><br />' + props.pop_est + ' people'
                : 'Hover over a place') + '</div>';
        };

        this.slideControl.onAdd = function (map) {
            // 這裡this為map
            this._div = L.DomUtil.get('slider'); // get a div element
            L.DomEvent.disableClickPropagation(this._div);

            // var draggable = new L.Draggable(this._div);
            // draggable.enable();
            // draggable.on('down', function (e) {
            // });
            // draggable.on('drag', function (e) {
            // });
            return this._div;
        };

        this.infoControl.addTo(this.map);
        this.slideControl.addTo(this.map);
        // #endregion

        // #region 與Map無關之視窗div屬性，click不與map連動
        this.windowList.forEach((value, index, array) => {
            const dragWindow = L.DomUtil.get(value.name);
            L.DomEvent.disableClickPropagation(dragWindow);
        });
        // #endregion
    }

    // #region Event function about Leaflet geojson
    onEachFeature(feature, layer) {
        layer.on({
            mouseover: (e) => this.highlightFeature(e),
            mouseout: (e) => this.resetHighlight(e),
            click: (e) => this.zoomToFeature(e)
        });
    }

    adjustZoom(value: number) {
        this.map.setZoom(value);
    }

    zoomToFeature(e) {
        this.map.fitBounds(e.target.getBounds());
    }

    resetHighlight(e) {
        this.worldGeoJson.resetStyle(e.target);
        this.infoControl.update();
    }

    highlightFeature(e) {
        const layer = e.target;
        layer.setStyle({
            weight: 4,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.6
        });

        this.infoControl.update(layer.feature.properties);

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }
    // #endregion

    // #region Dialogs
    openCreateDialog(data: v34): void {
        const isModified = false;
        const dialogRef = this.dialog.open(DialogSupplyChainCreateComponent, {
            width: '80%',
            data: [data, isModified]
        });

        dialogRef.afterClosed().subscribe(result => {
            // this.loadData();
        });
    }
    openDeleteDialog(item: v34): void {
        const dialogRef = this.dialog.open(DialogSupplyChainDeleteComponent, {
            width: '250px',
            data: item
        });

        dialogRef.afterClosed().subscribe(result => {
            // 刷新側欄
            // this.getSideDetail();
        });
    }
    // #endregion

    resizeToScreen(element, diff) {
        const wHeight = window.innerHeight;
        const objHeight = wHeight - diff;
        element.style.height = objHeight + 'px';
    }

    onToggle(id: number) {

        if (this.drawer.opened === false) {
            // 若drawer為關閉狀態
            this.drawer.opened = true;  // 打開side
            this.drawerPage = id;       // 顯示指定id page
        } else if (this.drawer.opened === true && this.drawerPage === id) {
            // 若drawer為開啟狀態且又再按同樣的button
            this.drawer.opened = false; // 關閉side
        } else if (this.drawer.opened === true && this.drawerPage !== id) {
            // 開啟狀態點不同button
            this.drawerPage = id;       // 直接切換到指定id page
        } else {
            // 其他狀況就關了吧～
            this.drawer.opened = false;
        }

    }

    dockOnClick(index: number) {
        this.windowService.emitWindowClose(index);
    }

    dockButtomActive() {
        this.windowList.forEach((v, i, a) => {

            const dockButtonClasses = document.getElementById('dockBtn' + i).classList;

            if (v.opened) {
                dockButtonClasses.add('btn-active');
            } else {
                dockButtonClasses.remove('btn-active');
            }

        });
    }
}

export class SwitchButton {
    name: string;
    value: number;
}

export class Window {
    name: string;
    value: number;
    opened: boolean;
    icon: string;
}
