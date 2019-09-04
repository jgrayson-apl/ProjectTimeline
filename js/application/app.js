/*
 | Copyright 2016 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([
  "boilerplate/ItemHelper",
  "boilerplate/UrlParamHelper",
  "dojo/i18n!./nls/resources",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/number",
  "dojo/date",
  "dojo/query",
  "dojo/on",
  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",
  "dojo/dom-geometry",
  "dojo/dom-construct",
  "dijit/ConfirmDialog",
  "esri/identity/IdentityManager",
  "esri/core/watchUtils",
  "esri/core/promiseUtils",
  "esri/portal/Portal",
  "esri/layers/Layer",
  "esri/widgets/Home",
  "esri/widgets/Search",
  "esri/widgets/LayerList",
  "esri/widgets/Legend",
  "esri/widgets/Print",
  "esri/widgets/ScaleBar",
  "esri/widgets/Compass",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Expand",
  "dojo/NodeList-dom",
  "dojo/domReady!"
], function (ItemHelper, UrlParamHelper, i18n, declare, lang, array, number, date, query, on,
             dom, domAttr, domClass, domGeom, domConstruct, ConfirmDialog,
             IdentityManager, watchUtils, promiseUtils, Portal, Layer,
             Home, Search, LayerList, Legend, Print, ScaleBar, Compass, BasemapGallery, Expand) {

  return declare(null, {

    config: null,
    direction: null,

    /**
     *
     * @param boilerplateResponse
     */
    init: function (boilerplateResponse) {
      if(boilerplateResponse) {
        this.direction = boilerplateResponse.direction;
        this.config = boilerplateResponse.config;
        this.settings = boilerplateResponse.settings;
        const boilerplateResults = boilerplateResponse.results;
        const webMapItem = boilerplateResults.webMapItem;
        const webSceneItem = boilerplateResults.webSceneItem;
        const groupData = boilerplateResults.group;

        document.documentElement.lang = boilerplateResponse.locale;

        this.urlParamHelper = new UrlParamHelper();
        this.itemHelper = new ItemHelper();

        this._setDirection();

        if(webMapItem) {
          this._createWebMap(webMapItem);
        } else if(webSceneItem) {
          this._createWebScene(webSceneItem);
        } else if(groupData) {
          this._createGroupGallery(groupData);
        } else {
          this.reportError(new Error("app:: Could not load an item to display"));
        }
      }
      else {
        this.reportError(new Error("app:: Boilerplate is not defined"));
      }
    },

    /**
     *
     * @param error
     * @returns {*}
     */
    reportError: function (error) {
      // remove loading class from body
      //domClass.remove(document.body, CSS.loading);
      //domClass.add(document.body, CSS.error);
      // an error occurred - notify the user. In this example we pull the string from the
      // resource.js file located in the nls folder because we've set the application up
      // for localization. If you don't need to support multiple languages you can hardcode the
      // strings here and comment out the call in index.html to get the localization strings.
      // set message
      let node = dom.byId("loading_message");
      if(node) {
        //node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + error.message + "</p>";
        node.innerHTML = "<h1><span></span>" + i18n.error + "</h1><p>" + error.message + "</p>";
      }
      return error;
    },

    /**
     *
     * @private
     */
    _setDirection: function () {
      let direction = this.direction;
      let dirNode = document.getElementsByTagName("html")[0];
      domAttr.set(dirNode, "dir", direction);
    },

    /**
     *
     * @param webMapItem
     * @private
     */
    _createWebMap: function (webMapItem) {
      this.itemHelper.createWebMap(webMapItem).then(function (map) {

        let viewProperties = {
          map: map,
          container: this.settings.webmap.containerId
        };

        if(!this.config.title && map.portalItem && map.portalItem.title) {
          this.config.title = map.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));
        require(["esri/views/MapView"], function (MapView) {

          let view = new MapView(viewProperties);
          view.when().then(function () {
            this.urlParamHelper.addToView(view, this.config);
            this._ready(view);
          }.bind(this), this.reportError);

        }.bind(this));
      }.bind(this), this.reportError);
    },

    /**
     *
     * @param webSceneItem
     * @private
     */
    _createWebScene: function (webSceneItem) {
      this.itemHelper.createWebScene(webSceneItem).then(function (map) {

        let viewProperties = {
          map: map,
          container: this.settings.webscene.containerId
        };

        if(!this.config.title && map.portalItem && map.portalItem.title) {
          this.config.title = map.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));
        require(["esri/views/SceneView"], function (SceneView) {

          let view = new SceneView(viewProperties);
          view.when().then(function () {
            this.urlParamHelper.addToView(view, this.config);
            this._ready(view);
          }.bind(this), this.reportError);
        }.bind(this));
      }.bind(this), this.reportError);
    },

    /**
     *
     * @param groupData
     * @private
     */
    _createGroupGallery: function (groupData) {
      let groupInfoData = groupData.infoData;
      let groupItemsData = groupData.itemsData;

      if(!groupInfoData || !groupItemsData || groupInfoData.total === 0 || groupInfoData instanceof Error) {
        this.reportError(new Error("app:: group data does not exist."));
        return;
      }

      let info = groupInfoData.results[0];
      let items = groupItemsData.results;

      this._ready();

      if(info && items) {
        let html = "";

        html += "<h1>" + info.title + "</h1>";

        html += "<ol>";

        items.forEach(function (item) {
          html += "<li>" + item.title + "</li>";
        });

        html += "</ol>";

        document.body.innerHTML = html;
      }

    },

    /**
     *
     * @private
     */
    _ready: function (view) {

      // TITLE //
      document.title = dom.byId("app-title-node").innerHTML = this.config.title;

      //
      // WIDGETS IN VIEW UI //
      //

      // LEFT PANE TOGGLE //
      const toggleLeftPaneNode = domConstruct.create("div", { title: "Toggle Left Panel", className: "toggle-pane-node esri-icon-expand" });
      view.ui.add(toggleLeftPaneNode, { position: "top-left", index: 0 });
      on(toggleLeftPaneNode, "click", function () {
        query(".ui-layout-left").toggleClass("hide");
        query(".ui-layout-center").toggleClass("column-18");
        query(".ui-layout-center").toggleClass("column-24");
        domClass.toggle(toggleLeftPaneNode, "esri-icon-collapse esri-icon-expand");
      }.bind(this));

      // HOME //
      const homeWidget = new Home({ view: view });
      view.ui.add(homeWidget, { position: "top-left", index: 1 });

      // COMPASS //
      if(view.type === "2d") {
        const compass = new Compass({ view: view });
        view.ui.add(compass, "top-left");
      }

      // SCALEBAR //
      const scaleBar = new ScaleBar({ view: view, unit: "dual" });
      view.ui.add(scaleBar, { position: "bottom-left" });

      //
      // WIDGETS IN EXPAND //
      //

      // SEARCH //
      const searchWidget = new Search({
        view: view,
        container: domConstruct.create("div")
      });
      // EXPAND SEARCH //
      const toolsExpand = new Expand({
        view: view,
        content: searchWidget.domNode,
        expandIconClass: "esri-icon-search",
        expandTooltip: "Search"
      }, domConstruct.create("div"));
      view.ui.add(toolsExpand, "top-right");

      // BASEMAP GALLERY //
      const basemapGallery = new BasemapGallery({
        view: view,
        container: domConstruct.create("div")
      });
      // EXPAND BASEMAP GALLERY //
      const basemapGalleryExpand = new Expand({
        view: view,
        content: basemapGallery.domNode,
        expandIconClass: "esri-icon-basemap",
        expandTooltip: "Basemap"
      }, domConstruct.create("div"));
      view.ui.add(basemapGalleryExpand, "top-right");


      //
      // WIDGETS IN TAB PANES //
      //

      // LAYER LIST //
      const layerList = new LayerList({
        view: view,
        createActionsFunction: function (evt) {
          let item = evt.item;

          let fullExtentAction = {
            id: "full-extent",
            title: "Go to full extent",
            className: "esri-icon-zoom-out-fixed"
          };

          let informationAction = {
            id: "information",
            title: "Layer information",
            className: "esri-icon-description"
          };

          let layerActions = [];
          if(item.layer) {
            layerActions.push(fullExtentAction);
            if(item.layer.url) {
              layerActions.push(informationAction);
            }
          }

          return [layerActions];
        }
      }, "layer-list-node");
      layerList.on("trigger-action", function (evt) {
        //console.info(evt);

        switch (evt.action.id) {
          case "full-extent":
            view.goTo(evt.item.layer.fullExtent);
            break;
          case "information":
            window.open(evt.item.layer.url);
            break;
        }
      }.bind(this));

      // LEGEND
      const legend = new Legend({ view: view }, "legend-node");

      // PRINT //
      const print = new Print({
        view: view,
        printServiceUrl: "//utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
      }, "print-node");

      // USER SIGN IN //
      this.initializeUserSignIn(view);

      // MAP DETAILS //
      this.displayMapDetails(view);

      // INITIALIZE PLACES //
      this.initializePlaces(view);

      // INITIALIZE PROJECT TIMELINE //
      this.initializeProjectTimeline(view);

    },

    /**
     * USER SIGN IN
     */
    initializeUserSignIn: function (view) {

      // TOGGLE SIGN IN/OUT //
      let signInNode = dom.byId("sign-in-node");
      let signOutNode = dom.byId("sign-out-node");
      let userNode = dom.byId("user-node");

      // SIGN IN //
      let userSignIn = function () {
        this.portal = new Portal({ authMode: "immediate" });
        this.portal.load().then(function () {
          //console.info(this.portal, this.portal.user);

          dom.byId("user-firstname-node").innerHTML = this.portal.user.fullName.split(" ")[0];
          dom.byId("user-fullname-node").innerHTML = this.portal.user.fullName;
          dom.byId("username-node").innerHTML = this.portal.user.username;
          dom.byId("user-thumb-node").src = this.portal.user.thumbnailUrl;

          domClass.add(signInNode, "hide");
          domClass.remove(userNode, "hide");

          // MAP DETAILS //
          this.displayMapDetails(view, this.portal);

        }.bind(this), console.warn);
      }.bind(this);

      // SIGN OUT //
      let userSignOut = function () {
        IdentityManager.destroyCredentials();
        this.portal = new Portal({});
        this.portal.load().then(function () {

          this.portal.user = null;
          domClass.remove(signInNode, "hide");
          domClass.add(userNode, "hide");

          // MAP DETAILS //
          this.displayMapDetails(view);

        }.bind(this));
      }.bind(this);

      // CALCITE CLICK EVENT //
      on(signInNode, "click", userSignIn);
      on(signOutNode, "click", userSignOut);

      // PORTAL //
      this.portal = new Portal({});
      // CHECK THE SIGN IN STATUS WHEN APP LOADS //
      IdentityManager.checkSignInStatus(this.portal.url).then(function () {
        userSignIn();
      }.bind(this));

    },

    /**
     * DISPLAY MAP DETAILS
     *
     * @param view
     * @param portal
     */
    displayMapDetails: function (view, portal) {

      const item = view.map.portalItem;
      const itemLastModifiedDate = (new Date(item.modified)).toLocaleString();

      dom.byId("current-map-card-thumb").src = item.thumbnailUrl;
      dom.byId("current-map-card-thumb").alt = item.title;
      dom.byId("current-map-card-caption").innerHTML = lang.replace("A map by {owner}", item);
      dom.byId("current-map-card-caption").title = "Last modified on " + itemLastModifiedDate;
      dom.byId("current-map-card-title").innerHTML = item.title;
      dom.byId("current-map-card-title").href = lang.replace("//{urlKey}.{customBaseUrl}/home/item.html?id={id}", {
        urlKey: portal ? portal.urlKey : "www",
        customBaseUrl: portal ? portal.customBaseUrl : "arcgis.com",
        id: item.id
      });
      dom.byId("current-map-card-description").innerHTML = item.description;

    },


    /**
     *
     * @param view
     */
    initializePlaces: function (view) {

      const placesContainer = dom.byId("places-node");

      if(view.map.presentation && view.map.presentation.slides && (view.map.presentation.slides.length > 0)) {
        // SLIDES //
        view.map.presentation.slides.forEach(function (slide) {

          const slideNode = domConstruct.create("div", { className: "places-node" }, placesContainer);
          domConstruct.create("div", { className: "places-title", innerHTML: slide.title.text }, slideNode);
          domConstruct.create("img", { className: "places-thumbnail", src: slide.thumbnail.url }, slideNode);

          on(slideNode, "click", function () {
            query(".places-node").removeClass("selected");
            domClass.add(slideNode, "selected");

            slide.applyTo(view, {
              animate: true,
              speedFactor: 0.5,
              easing: "in-out-cubic"   // linear, in-cubic, out-cubic, in-out-cubic, in-expo, out-expo, in-out-expo
            });

          }.bind(this));
        });

        view.on("layerview-create", function (evt) {
          slides.forEach(function (slide) {
            slide.visibleLayers.add({ id: evt.layer.id });
          }.bind(this));
        }.bind(this));

      } else if(view.map.bookmarks && view.map.bookmarks.length > 0) {
        // BOOKMARKS //
        view.map.bookmarks.forEach(function (bookmark) {

          const bookmarkNode = domConstruct.create("div", { className: "places-node" }, placesContainer);
          domConstruct.create("div", { className: "places-title", innerHTML: bookmark.name }, bookmarkNode);

          on(bookmarkNode, "click", function () {
            query(".places-node").removeClass("selected");
            domClass.add(bookmarkNode, "selected");
            view.goTo(bookmark.extent);
          }.bind(this));

        }.bind(this));

      } else {
        domConstruct.create("div", { className: "text-light-gray avenir-italic", innerHTML: "No places available in this map" }, placesContainer);
      }

    },

    /**
      * UPDATE UI ELEMENTS BASED ON FEATURE OID VISIBLE
      *
      * @param layer
      * @param projectLocationFeatures
      * @returns {Promise}
      */
    updateProjectTimelines: function(layer, projectLocationFeatures) {
      return layer.queryObjectIds().then(function(currentIds) {
        projectLocationFeatures.forEach((graphic) => {
          const objectId = graphic.attributes[layer.objectIdField];
          if (currentIds.indexOf(objectId) < 0) {
            query(lang.replace("[data-oid='{0}']", [objectId])).addClass("disabled");
          } else {
            query(lang.replace("[data-oid='{0}']", [objectId])).removeClass("disabled");
          }
        });
      });
    },

    /**
     *
     * @param view
     */
    initializeProjectTimeline: function (view) {

      const projectLocationsLayer = view.map.allLayers.find(layer => {
        return (layer.title === "Project Locations");
      });
      projectLocationsLayer.queryFeatures().then(function (queryResult) {
        let projectLocationFeatures = queryResult.features;
        const projectLayerObjectIdField = projectLocationsLayer.objectIdField;

        this.displayProjectPopup = this._displayProjectPopup(projectLocationFeatures, projectLayerObjectIdField);
        this.addProjectToList = this._addProjectToList(projectLayerObjectIdField);

        var update = promiseUtils.debounce(this.updateProjectTimelines.bind(this, projectLocationsLayer, projectLocationFeatures));
        watchUtils.watch(projectLocationsLayer, "definitionExpression", update);

        if(projectLocationFeatures.length > 0) {

          // SORT BASED ON START DATE //
          projectLocationFeatures.sort((projectA, projectB) => {
            return (+projectA.getAttribute("StartDate")) - (+projectB.getAttribute("StartDate"));
          });

          // REDUCE PROJECT FEATURES: MIN/MAX DATES AND GROUPED BY STATUS //
          const projectByStatus = projectLocationFeatures.reduce((projectByStatus, projectLocationFeature) => {
            projectByStatus.minDate = Math.min(projectByStatus.minDate, +projectLocationFeature.getAttribute("StartDate"));
            projectByStatus.maxDate = Math.max(projectByStatus.maxDate, +projectLocationFeature.getAttribute("EndDate"));
            if(projectLocationFeature.getAttribute("Status") === "completed") {
              projectByStatus.completed.push(projectLocationFeature);
            } else {
              projectByStatus.active.push(projectLocationFeature);
            }
            return projectByStatus;
          }, { completed: [], active: [], minDate: Infinity, maxDate: 0 });


          // TIME SPAN OF ALL PROJECTS //
          const allProjectsTimeSpan = (projectByStatus.maxDate - projectByStatus.minDate);
          const allProjectsTimeSpanDays = date.difference(new Date(projectByStatus.minDate), new Date(projectByStatus.maxDate), "day");


          // LEFT PANEL ITEMS //
          if(projectByStatus.completed.length > 0) {
            const projectsCompletedList = dom.byId("projects-completed-list");
            projectsCompletedList.innerHTML = "";
            projectByStatus.completed.forEach((projectLocationFeature) => {
              this.addProjectToList(view, projectsCompletedList, projectLocationFeature);
            });
          }
          if(projectByStatus.active.length > 0) {
            const activeProjectListNode = dom.byId("projects-active-list");
            activeProjectListNode.innerHTML = "";
            projectByStatus.active.forEach(projectLocationFeature => {
              this.addProjectToList(view, activeProjectListNode, projectLocationFeature);
            });
          }


          const timeFilterChk = dom.byId("timeline-filter-chk");
          on(timeFilterChk, "change", () => {
            query("#timeline-row").toggleClass("hide");
            this.timelineFilterUpdated();
          });

          // START END LABEL //
          /*const startEndLabel = dom.byId("start-end-date-label");
           startEndLabel.innerHTML = lang.replace("Time span for all projects: {minStartDate} to {maxEndDate}", {
           minStartDate: this._formatDate(projectByStatus.minDate),
           maxEndDate: this._formatDate(projectByStatus.maxDate)
           });*/


          // TIMELINE RANGE INPUT //
          const timelineRangeLabel = dom.byId("timeline-range-label");
          timelineRangeLabel.innerHTML = this._formatDate(projectByStatus.minDate);

          // CURRENT DATE VALUE //
          let currentDateValue = projectByStatus.minDate;

          // TIMELINE //
          const timelineHeaderCell = dom.byId("timeline-header-cell");
          const timelineCellContentBox = domGeom.getContentBox(timelineHeaderCell);
          const timelineCellPaddingBox = domGeom.getPadExtents(timelineHeaderCell);
          const timelineInputPadding = { r: 5, l: 5 };
          const timelineHeaderCellPadding = timelineCellPaddingBox.r + timelineInputPadding.r;
          const timelineHeaderCellWidth = timelineCellContentBox.w
              - timelineCellPaddingBox.r
              - timelineCellPaddingBox.l
              - timelineInputPadding.r
              - timelineInputPadding.l;

          const timelineTableBody = dom.byId("timeline-table-body");
          const timelineRow = domConstruct.create("tr", { id: "timeline-row", className: "font-siz--3" }, timelineTableBody);
          domConstruct.create("td", { innerHTML: "&nbsp;" }, timelineRow);
          const timelineDatesCell = domConstruct.create("td", { className: "timeline-date-cell" }, timelineRow);
          domConstruct.create("td", { innerHTML: "&nbsp;" }, timelineRow);

          const oneDay = (1000 * 60 * 60 * 24);

          const timelineRangeInput = domConstruct.create("input", {
            id: "timeline-range-input",
            className: "",
            type: "range",
            min: 0, max: allProjectsTimeSpan, step: oneDay
          }, timelineDatesCell);

          this.timelineFilterUpdated = () => {
            view.popup.close();
            if(timeFilterChk.checked) {
              timelineRangeLabel.innerHTML = this._formatDate(currentDateValue);
              const timeFilter = lang.replace("(StartDate <= '{0}') AND (EndDate >= '{0}')", [new Date(currentDateValue).toISOString()]);
              timelineRangeLabel.title = timeFilter;
              projectLocationsLayer.definitionExpression = timeFilter
            } else {
              timelineRangeLabel.innerHTML = "";
              projectLocationsLayer.definitionExpression = "1=1";
            }
          };

          on(timelineRangeInput, "input", () => {
            currentDateValue = projectByStatus.minDate + timelineRangeInput.valueAsNumber;
            this.timelineFilterUpdated();
          });
          on(timelineRangeInput, "change", () => {
            this.timelineFilterUpdated();
          });

          const setTimelineFilter = (timelineDateValue) => {
            timelineRangeInput.valueAsNumber = (timelineDateValue - projectByStatus.minDate);
            currentDateValue = projectByStatus.minDate + timelineRangeInput.valueAsNumber;
            this.timelineFilterUpdated();
          };
          setTimelineFilter(projectByStatus.minDate);


          const timelineDates = [];
          const addDateToTimeline = (dateValue) => {
            if(timelineDates.indexOf(dateValue) === -1) {
              timelineDates.push(dateValue);
            }
          };

          projectLocationFeatures.forEach((projectLocationFeature) => {
            const startDate = +projectLocationFeature.getAttribute("StartDate");
            const endDate = +projectLocationFeature.getAttribute("EndDate");
            addDateToTimeline(startDate);
            addDateToTimeline(endDate);

            const projectRow = domConstruct.create("tr", {
              "data-oid": projectLocationFeature.getAttribute(projectLayerObjectIdField),
              className: "font-siz--3"
            }, timelineTableBody);

            domConstruct.create("td", {
              className: "text-blue",
              innerHTML: projectLocationFeature.getAttribute("Name")
            }, projectRow);
            /*
             domConstruct.create("td", {
             className: "text-center",
             innerHTML: this._formatDate(startDate)
             }, projectRow);
             */
            const timelineCell = domConstruct.create("td", {}, projectRow);
            /*
             domConstruct.create("td", {
             className: "text-center",
             innerHTML: this._formatDate(endDate)
             }, projectRow);
             */
            domConstruct.create("td", {
              className: "text-center",
              innerHTML: projectLocationFeature.getAttribute("Status")
            }, projectRow);


            const relativeStart = 1.0 - (projectByStatus.maxDate - startDate) / allProjectsTimeSpan;
            const relativeEnd = 1.0 - (projectByStatus.maxDate - endDate) / allProjectsTimeSpan;
            const timelineStart = timelineHeaderCellPadding + (timelineHeaderCellWidth * relativeStart);
            const timelineWidth = (timelineHeaderCellWidth * (relativeEnd - relativeStart));

            const timelineBarNode = domConstruct.create("div", {
              className: "timeline-bar tooltip tooltip-top",
              "aria-label": lang.replace("{0} to {1}", [this._formatDate(startDate), this._formatDate(endDate)]),
              style: lang.replace("margin-left:{0}px;width:{1}px", [timelineStart, timelineWidth])
            }, timelineCell);

            on(timelineBarNode, "click", () => {
              this.displayProjectPopup(view, projectLocationFeature);
            });

          });

          const timelineDateBarsNode = domConstruct.create("div", { id: "timeline-date-bars" }, timelineDatesCell);
          const timelineDateBarWidth = 5;
          const sliderHandleWidth = 8;

          timelineDates.forEach(timelineDate => {
            const relativeStart = 1.0 - (projectByStatus.maxDate - timelineDate) / allProjectsTimeSpan;
            const timelineDateStart = sliderHandleWidth + ((timelineHeaderCellWidth + timelineDateBarWidth) * relativeStart);

            const timelineBarNode = domConstruct.create("span", {
              className: "timeline-date-bar tooltip tooltip-top",
              "aria-label": lang.replace("{0}", [this._formatDate(timelineDate)]),
              style: lang.replace("margin-left:{0}px;", [timelineDateStart])
            }, timelineDateBarsNode);

            on(timelineBarNode, "click", () => {
              setTimelineFilter(timelineDate);
            })
          });

        }

      }.bind(this));

    },

    _formatDate: function (dateValue) {
      return (new Date(dateValue)).toLocaleDateString();
    },

    _addProjectToList: function (objectIdField) {
      return function (view, projectList, projectFeature) {

        const projectNode = domConstruct.create("div", {
          "data-oid": projectFeature.getAttribute(objectIdField),
          className: "project-list-node side-nav-link",
          title: lang.replace("#{ID}: {Description}", projectFeature.attributes)
        }, projectList);

        domConstruct.create("span", {
          className: "text-blue",
          innerHTML: projectFeature.getAttribute("Name")
        }, projectNode);

        domConstruct.create("span", {
          className: "text-dark-gray font-size--3 avenir-italic right",
          innerHTML: projectFeature.getAttribute("Status")
        }, projectNode);

        on(projectNode, "click", () => {
          this.displayProjectPopup(view, projectFeature);
        });

      }
    },

    _displayProjectPopup: function (projectLocationFeatures, objectIdField) {
      return function (view, projectFeature) {
        const projectFeatureInLayer = projectLocationFeatures.find(feature => {
          return (feature.getAttribute(objectIdField) === projectFeature.getAttribute(objectIdField));
        });
        if(projectFeatureInLayer) {
          view.popup.open({
            location: projectFeatureInLayer.geometry.extent.clone().offset(0, projectFeatureInLayer.geometry.extent.height * 0.5).center,
            features: [projectFeatureInLayer]
          });
        }
      }
    }

  });
});

