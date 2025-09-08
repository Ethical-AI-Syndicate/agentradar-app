const { createLogger } = require('../../utils/logger');
const CacheManager = require('../cache/cacheManager');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class ARPropertyTourService {
  constructor() {
    this.logger = createLogger();
    this.cache = CacheManager;
    this.tours = new Map();
    this.arAssets = new Map();
    this.tourSessions = new Map();
    this.mediaProcessor = new MediaProcessor();
    this.ar3DModels = new Map();
    this.virtualStaging = new Map();
    
    this.initializeService();
  }

  async initializeService() {
    try {
      this.logger.info('Initializing AR Property Tour Service...');
      
      await this.setupTourTypes();
      await this.initializeARFrameworks();
      await this.loadExistingTours();
      await this.setupMediaProcessing();
      
      this.logger.info(`AR Property Tour Service initialized with ${this.tours.size} tours`);
      
    } catch (error) {
      this.logger.error('Failed to initialize AR Property Tour Service:', error);
      throw error;
    }
  }

  async setupTourTypes() {
    const tourTypes = {
      BASIC_360: {
        id: 'BASIC_360',
        name: 'Basic 360° Virtual Tour',
        description: 'Panoramic photos with hotspot navigation',
        features: ['360_photos', 'hotspot_navigation', 'floor_plan_overlay'],
        arCapabilities: ['basic_measurements', 'virtual_furniture_placement'],
        maxRooms: 20,
        storageLimit: '500MB',
        processingTime: 'fast'
      },

      PROFESSIONAL_AR: {
        id: 'PROFESSIONAL_AR',
        name: 'Professional AR Experience',
        description: 'High-end AR tour with advanced features',
        features: ['360_photos', 'ar_overlays', 'virtual_staging', 'interactive_elements'],
        arCapabilities: ['room_measurements', 'furniture_placement', 'renovation_preview', 'lighting_simulation'],
        maxRooms: 50,
        storageLimit: '2GB',
        processingTime: 'standard'
      },

      PREMIUM_IMMERSIVE: {
        id: 'PREMIUM_IMMERSIVE',
        name: 'Premium Immersive Experience',
        description: 'Complete immersive AR/VR experience with AI enhancements',
        features: ['360_photos', 'ar_overlays', 'vr_support', 'ai_staging', 'voice_guidance', 'interactive_features'],
        arCapabilities: ['full_3d_scanning', 'realistic_furniture_placement', 'renovation_simulation', 'lighting_analysis', 'material_preview'],
        maxRooms: 100,
        storageLimit: '5GB',
        processingTime: 'extended'
      },

      DEVELOPMENT_PREVIEW: {
        id: 'DEVELOPMENT_PREVIEW',
        name: 'Development Preview Tour',
        description: 'Showcase future developments with AR visualization',
        features: ['site_visualization', 'building_overlay', 'amenity_preview', 'neighborhood_integration'],
        arCapabilities: ['construction_timeline', 'completion_preview', 'amenity_visualization', 'view_simulation'],
        maxRooms: 200,
        storageLimit: '10GB',
        processingTime: 'premium'
      }
    };

    for (const [typeId, tourType] of Object.entries(tourTypes)) {
      this.tourTypes.set(typeId, tourType);
    }

    this.logger.info(`Setup ${Object.keys(tourTypes).length} tour types`);
  }

  async initializeARFrameworks() {
    const frameworks = {
      AR_JS: {
        id: 'AR_JS',
        name: 'AR.js Framework',
        platform: 'web',
        capabilities: ['marker_tracking', 'location_based_ar', 'image_tracking'],
        deviceSupport: ['mobile_web', 'desktop_web'],
        performance: 'good'
      },

      ARCORE_UNITY: {
        id: 'ARCORE_UNITY',
        name: 'ARCore with Unity',
        platform: 'android',
        capabilities: ['plane_detection', 'light_estimation', 'occlusion', 'persistent_anchors'],
        deviceSupport: ['android_arcore'],
        performance: 'excellent'
      },

      ARKIT_UNITY: {
        id: 'ARKIT_UNITY',
        name: 'ARKit with Unity',
        platform: 'ios',
        capabilities: ['plane_detection', 'face_tracking', 'body_tracking', 'object_occlusion'],
        deviceSupport: ['ios_arkit'],
        performance: 'excellent'
      },

      WEBXR: {
        id: 'WEBXR',
        name: 'WebXR Framework',
        platform: 'web',
        capabilities: ['ar_session', 'hit_testing', 'light_estimation', 'hand_tracking'],
        deviceSupport: ['webxr_compatible'],
        performance: 'very_good'
      },

      EIGHT_THWALL: {
        id: 'EIGHT_THWALL',
        name: '8th Wall AR Engine',
        platform: 'web',
        capabilities: ['world_tracking', 'image_targets', 'face_effects', 'sky_effects'],
        deviceSupport: ['mobile_web', 'desktop_web'],
        performance: 'excellent'
      }
    };

    for (const [frameworkId, framework] of Object.entries(frameworks)) {
      this.arFrameworks.set(frameworkId, framework);
    }

    this.logger.info(`Initialized ${Object.keys(frameworks).length} AR frameworks`);
  }

  async createPropertyTour(tourData) {
    try {
      const tourId = this.generateTourId(tourData.propertyId, tourData.tourType);
      
      const tour = {
        id: tourId,
        propertyId: tourData.propertyId,
        tourType: tourData.tourType,
        title: tourData.title,
        description: tourData.description,
        createdBy: tourData.createdBy,
        createdAt: new Date(),
        status: 'processing',
        progress: 0,
        
        // Tour Configuration
        config: {
          enableAR: tourData.enableAR !== false,
          enableVR: tourData.enableVR || false,
          enableVirtualStaging: tourData.enableVirtualStaging || false,
          enableMeasurements: tourData.enableMeasurements !== false,
          enableVoiceGuidance: tourData.enableVoiceGuidance || false,
          quality: tourData.quality || 'high',
          target: tourData.target || 'mobile_web'
        },
        
        // Content Structure
        content: {
          rooms: [],
          exteriorViews: [],
          floorPlans: [],
          amenities: [],
          neighborhood: []
        },
        
        // AR Assets
        arAssets: {
          anchors: [],
          models: [],
          annotations: [],
          measurements: [],
          staging: []
        },
        
        // Metadata
        metadata: {
          totalRooms: 0,
          totalPhotos: 0,
          totalSize: 0,
          processingTime: null,
          lastUpdated: new Date()
        },
        
        // Access Control
        access: {
          public: tourData.publicAccess || false,
          password: tourData.password || null,
          allowedUsers: tourData.allowedUsers || [],
          expiresAt: tourData.expiresAt || null
        },
        
        // Analytics
        analytics: {
          totalViews: 0,
          uniqueVisitors: 0,
          averageSessionTime: 0,
          interactionHeatmap: {},
          conversionEvents: []
        }
      };

      this.tours.set(tourId, tour);
      
      // Start processing tour content
      this.processTourContent(tourId, tourData);
      
      this.logger.info(`Created property tour: ${tourId} for property ${tourData.propertyId}`);
      
      return {
        success: true,
        tourId: tourId,
        status: 'processing',
        estimatedCompletionTime: this.estimateProcessingTime(tourData)
      };

    } catch (error) {
      this.logger.error('Error creating property tour:', error);
      throw error;
    }
  }

  async processTourContent(tourId, tourData) {
    try {
      const tour = this.tours.get(tourId);
      if (!tour) {
        throw new Error(`Tour not found: ${tourId}`);
      }

      tour.status = 'processing';
      tour.progress = 10;

      // Process uploaded media
      if (tourData.photos && tourData.photos.length > 0) {
        await this.processPhotos(tourId, tourData.photos);
        tour.progress = 30;
      }

      // Process 360° panoramas
      if (tourData.panoramas && tourData.panoramas.length > 0) {
        await this.processPanoramas(tourId, tourData.panoramas);
        tour.progress = 50;
      }

      // Process floor plans
      if (tourData.floorPlans && tourData.floorPlans.length > 0) {
        await this.processFloorPlans(tourId, tourData.floorPlans);
        tour.progress = 60;
      }

      // Generate AR assets
      if (tour.config.enableAR) {
        await this.generateARAssets(tourId);
        tour.progress = 75;
      }

      // Apply virtual staging
      if (tour.config.enableVirtualStaging) {
        await this.applyVirtualStaging(tourId, tourData.stagingPreferences);
        tour.progress = 85;
      }

      // Generate navigation and hotspots
      await this.generateNavigationElements(tourId);
      tour.progress = 95;

      // Finalize tour
      await this.finalizeTour(tourId);
      tour.progress = 100;
      tour.status = 'ready';
      tour.metadata.processingTime = Date.now() - tour.createdAt.getTime();
      
      // Cache the completed tour
      await this.cacheTour(tourId);
      
      this.logger.info(`Completed processing for tour: ${tourId}`);
      
      // Notify completion via WebSocket if available
      if (global.socketService) {
        global.socketService.broadcastToChannel(`tour_${tourId}`, {
          type: 'tour_processing_complete',
          tourId: tourId,
          status: 'ready'
        });
      }

    } catch (error) {
      const tour = this.tours.get(tourId);
      if (tour) {
        tour.status = 'error';
        tour.error = error.message;
      }
      
      this.logger.error(`Error processing tour ${tourId}:`, error);
    }
  }

  async processPhotos(tourId, photos) {
    try {
      const tour = this.tours.get(tourId);
      const processedPhotos = [];

      for (const photo of photos) {
        const processed = await this.mediaProcessor.processImage(photo, {
          formats: ['webp', 'jpg'],
          qualities: [90, 75, 60],
          sizes: [
            { width: 1920, height: 1080, label: 'full' },
            { width: 1280, height: 720, label: 'hd' },
            { width: 640, height: 360, label: 'mobile' },
            { width: 320, height: 180, label: 'thumbnail' }
          ]
        });

        const roomId = photo.roomId || this.generateRoomId(photo.location || 'Unknown Room');
        const photoData = {
          id: this.generatePhotoId(),
          roomId: roomId,
          originalFilename: photo.filename,
          location: photo.location,
          caption: photo.caption,
          timestamp: photo.timestamp || new Date(),
          processed: processed,
          arAnchors: [],
          hotspots: photo.hotspots || [],
          measurements: photo.measurements || []
        };

        processedPhotos.push(photoData);
        
        // Update or create room
        let room = tour.content.rooms.find(r => r.id === roomId);
        if (!room) {
          room = {
            id: roomId,
            name: photo.location || 'Unknown Room',
            type: photo.roomType || 'room',
            photos: [],
            panoramas: [],
            measurements: {},
            arAssets: []
          };
          tour.content.rooms.push(room);
        }
        
        room.photos.push(photoData);
      }

      tour.metadata.totalPhotos += processedPhotos.length;
      tour.metadata.totalRooms = tour.content.rooms.length;
      
      this.logger.info(`Processed ${processedPhotos.length} photos for tour ${tourId}`);
      
    } catch (error) {
      this.logger.error(`Error processing photos for tour ${tourId}:`, error);
      throw error;
    }
  }

  async processPanoramas(tourId, panoramas) {
    try {
      const tour = this.tours.get(tourId);
      const processedPanoramas = [];

      for (const panorama of panoramas) {
        // Process 360° image
        const processed = await this.mediaProcessor.process360Image(panorama, {
          projection: 'equirectangular',
          formats: ['webp', 'jpg'],
          qualities: [90, 75],
          sizes: [
            { width: 4096, height: 2048, label: 'ultra' },
            { width: 2048, height: 1024, label: 'high' },
            { width: 1024, height: 512, label: 'medium' }
          ]
        });

        // Extract depth information if available
        let depthMap = null;
        if (panorama.depthData) {
          depthMap = await this.processDepthMap(panorama.depthData);
        }

        const roomId = panorama.roomId || this.generateRoomId(panorama.location || 'Unknown Room');
        const panoramaData = {
          id: this.generatePanoramaId(),
          roomId: roomId,
          originalFilename: panorama.filename,
          location: panorama.location,
          rotation: panorama.rotation || { yaw: 0, pitch: 0, roll: 0 },
          processed: processed,
          depthMap: depthMap,
          hotspots: panorama.hotspots || [],
          arAnchors: [],
          measurements: panorama.measurements || [],
          nadir: panorama.nadir || null, // Floor logo/watermark
          zenith: panorama.zenith || null // Ceiling replacement
        };

        processedPanoramas.push(panoramaData);
        
        // Update room with panorama
        let room = tour.content.rooms.find(r => r.id === roomId);
        if (!room) {
          room = {
            id: roomId,
            name: panorama.location || 'Unknown Room',
            type: panorama.roomType || 'room',
            photos: [],
            panoramas: [],
            measurements: {},
            arAssets: []
          };
          tour.content.rooms.push(room);
        }
        
        room.panoramas.push(panoramaData);
      }

      this.logger.info(`Processed ${processedPanoramas.length} panoramas for tour ${tourId}`);
      
    } catch (error) {
      this.logger.error(`Error processing panoramas for tour ${tourId}:`, error);
      throw error;
    }
  }

  async processFloorPlans(tourId, floorPlans) {
    try {
      const tour = this.tours.get(tourId);
      const processedFloorPlans = [];

      for (const floorPlan of floorPlans) {
        // Process floor plan image
        const processed = await this.mediaProcessor.processFloorPlan(floorPlan, {
          formats: ['svg', 'webp', 'jpg'],
          vectorize: true,
          extractRooms: true,
          calibrateScale: true
        });

        // Extract room boundaries and connections
        const roomLayout = await this.extractRoomLayout(processed);
        
        // Generate navigation paths
        const navigationPaths = await this.generateNavigationPaths(roomLayout);

        const floorPlanData = {
          id: this.generateFloorPlanId(),
          level: floorPlan.level || 'main',
          originalFilename: floorPlan.filename,
          processed: processed,
          roomLayout: roomLayout,
          navigationPaths: navigationPaths,
          scale: floorPlan.scale || null,
          orientation: floorPlan.orientation || 0,
          dimensions: floorPlan.dimensions || null,
          arOverlays: []
        };

        processedFloorPlans.push(floorPlanData);
        tour.content.floorPlans.push(floorPlanData);
      }

      this.logger.info(`Processed ${processedFloorPlans.length} floor plans for tour ${tourId}`);
      
    } catch (error) {
      this.logger.error(`Error processing floor plans for tour ${tourId}:`, error);
      throw error;
    }
  }

  async generateARAssets(tourId) {
    try {
      const tour = this.tours.get(tourId);
      
      // Generate AR anchors for each room
      for (const room of tour.content.rooms) {
        const arAssets = await this.generateRoomARAssets(room, tour.config);
        room.arAssets = arAssets;
        
        // Add to tour-level AR assets collection
        tour.arAssets.anchors.push(...arAssets.anchors);
        tour.arAssets.models.push(...arAssets.models);
        tour.arAssets.annotations.push(...arAssets.annotations);
      }

      // Generate measurement tools
      if (tour.config.enableMeasurements) {
        await this.generateMeasurementTools(tourId);
      }

      // Generate virtual staging assets
      if (tour.config.enableVirtualStaging) {
        await this.generateVirtualStagingAssets(tourId);
      }

      this.logger.info(`Generated AR assets for tour ${tourId}`);
      
    } catch (error) {
      this.logger.error(`Error generating AR assets for tour ${tourId}:`, error);
      throw error;
    }
  }

  async generateRoomARAssets(room, config) {
    try {
      const assets = {
        anchors: [],
        models: [],
        annotations: [],
        measurements: []
      };

      // Generate surface anchors (floor, walls, ceiling)
      const surfaces = await this.detectSurfaces(room);
      for (const surface of surfaces) {
        const anchor = {
          id: this.generateAnchorId(),
          type: surface.type,
          position: surface.position,
          rotation: surface.rotation,
          scale: surface.scale,
          confidence: surface.confidence
        };
        assets.anchors.push(anchor);
      }

      // Generate feature point annotations
      const features = await this.detectRoomFeatures(room);
      for (const feature of features) {
        const annotation = {
          id: this.generateAnnotationId(),
          type: feature.type,
          position: feature.position,
          content: feature.description,
          interactive: true,
          style: 'info_bubble'
        };
        assets.annotations.push(annotation);
      }

      // Generate furniture placement zones
      const placementZones = await this.generateFurniturePlacementZones(room);
      for (const zone of placementZones) {
        const model = {
          id: this.generateModelId(),
          type: 'placement_zone',
          category: zone.category,
          position: zone.position,
          dimensions: zone.dimensions,
          orientation: zone.orientation,
          restrictions: zone.restrictions
        };
        assets.models.push(model);
      }

      return assets;

    } catch (error) {
      this.logger.error('Error generating room AR assets:', error);
      throw error;
    }
  }

  async applyVirtualStaging(tourId, stagingPreferences = {}) {
    try {
      const tour = this.tours.get(tourId);
      const stagingAssets = [];

      const defaultPreferences = {
        style: 'modern',
        budget: 'moderate',
        target_demographic: 'general',
        color_scheme: 'neutral',
        furniture_density: 'optimal'
      };

      const preferences = { ...defaultPreferences, ...stagingPreferences };

      for (const room of tour.content.rooms) {
        const roomStaging = await this.stageRoom(room, preferences);
        stagingAssets.push(roomStaging);
        
        // Add staging models to room AR assets
        if (roomStaging.models) {
          room.arAssets.models.push(...roomStaging.models);
        }
      }

      tour.arAssets.staging = stagingAssets;
      
      this.logger.info(`Applied virtual staging to ${stagingAssets.length} rooms in tour ${tourId}`);
      
    } catch (error) {
      this.logger.error(`Error applying virtual staging to tour ${tourId}:`, error);
      throw error;
    }
  }

  async stageRoom(room, preferences) {
    try {
      const staging = {
        roomId: room.id,
        style: preferences.style,
        models: [],
        lighting: [],
        materials: []
      };

      // AI-powered furniture selection based on room type and preferences
      const furnitureRecommendations = await this.recommendFurniture(room, preferences);
      
      for (const recommendation of furnitureRecommendations) {
        const furnitureModel = {
          id: this.generateModelId(),
          type: 'furniture',
          category: recommendation.category,
          name: recommendation.name,
          model: recommendation.modelUrl,
          materials: recommendation.materials,
          position: recommendation.position,
          rotation: recommendation.rotation,
          scale: recommendation.scale,
          price: recommendation.price || null,
          brand: recommendation.brand || null,
          purchaseUrl: recommendation.purchaseUrl || null
        };

        staging.models.push(furnitureModel);
      }

      // Add lighting enhancements
      const lightingEnhancements = await this.generateLightingEnhancements(room, preferences);
      staging.lighting = lightingEnhancements;

      // Add material/texture overlays
      const materialOverlays = await this.generateMaterialOverlays(room, preferences);
      staging.materials = materialOverlays;

      return staging;

    } catch (error) {
      this.logger.error('Error staging room:', error);
      throw error;
    }
  }

  async recommendFurniture(room, preferences) {
    try {
      // Mock AI-powered furniture recommendation
      const recommendations = [];
      const roomType = room.type?.toLowerCase() || 'room';

      const furnitureDatabase = {
        living_room: [
          { category: 'seating', name: 'Modern Sofa', position: [0, 0, -2], price: 1200 },
          { category: 'table', name: 'Coffee Table', position: [0, 0, -1], price: 400 },
          { category: 'entertainment', name: 'TV Stand', position: [0, 0, 3], price: 300 }
        ],
        bedroom: [
          { category: 'bed', name: 'Platform Bed', position: [0, 0, 0], price: 800 },
          { category: 'storage', name: 'Dresser', position: [2, 0, 1], price: 500 },
          { category: 'seating', name: 'Accent Chair', position: [-2, 0, 1], price: 350 }
        ],
        kitchen: [
          { category: 'appliance', name: 'Modern Refrigerator', position: [2, 0, 2], price: 1500 },
          { category: 'island', name: 'Kitchen Island', position: [0, 0, 0], price: 1000 }
        ],
        dining_room: [
          { category: 'table', name: 'Dining Table', position: [0, 0, 0], price: 600 },
          { category: 'seating', name: 'Dining Chairs', position: [0, 0, 0], price: 150 }
        ]
      };

      const roomFurniture = furnitureDatabase[roomType] || furnitureDatabase.living_room;
      
      for (const item of roomFurniture) {
        recommendations.push({
          ...item,
          modelUrl: `/models/furniture/${preferences.style}/${item.category}/${item.name.toLowerCase().replace(/\s+/g, '_')}.glb`,
          materials: [`${preferences.color_scheme}_${preferences.style}`],
          rotation: [0, Math.random() * 360, 0],
          scale: [1, 1, 1],
          brand: 'Virtual Staging Co.',
          purchaseUrl: `https://furniture.example.com/items/${item.name.toLowerCase().replace(/\s+/g, '-')}`
        });
      }

      return recommendations;

    } catch (error) {
      this.logger.error('Error recommending furniture:', error);
      return [];
    }
  }

  async generateNavigationElements(tourId) {
    try {
      const tour = this.tours.get(tourId);
      
      // Generate hotspots between rooms
      for (let i = 0; i < tour.content.rooms.length; i++) {
        const currentRoom = tour.content.rooms[i];
        const connectedRooms = await this.findConnectedRooms(currentRoom, tour.content.rooms);
        
        for (const connectedRoom of connectedRooms) {
          const hotspot = {
            id: this.generateHotspotId(),
            type: 'navigation',
            sourceRoomId: currentRoom.id,
            targetRoomId: connectedRoom.id,
            position: await this.calculateHotspotPosition(currentRoom, connectedRoom),
            label: `Go to ${connectedRoom.name}`,
            icon: 'arrow',
            animation: 'pulse'
          };

          // Add hotspot to panoramas in the room
          for (const panorama of currentRoom.panoramas) {
            panorama.hotspots.push(hotspot);
          }
        }
      }

      // Generate info hotspots for features
      for (const room of tour.content.rooms) {
        const features = await this.identifyRoomFeatures(room);
        
        for (const feature of features) {
          const infoHotspot = {
            id: this.generateHotspotId(),
            type: 'information',
            position: feature.position,
            label: feature.name,
            description: feature.description,
            icon: 'info',
            content: {
              text: feature.details,
              images: feature.images || [],
              links: feature.links || []
            }
          };

          // Add to first panorama in room
          if (room.panoramas.length > 0) {
            room.panoramas[0].hotspots.push(infoHotspot);
          }
        }
      }

      this.logger.info(`Generated navigation elements for tour ${tourId}`);
      
    } catch (error) {
      this.logger.error(`Error generating navigation elements for tour ${tourId}:`, error);
      throw error;
    }
  }

  async startTourSession(tourId, sessionData) {
    try {
      const tour = this.tours.get(tourId);
      if (!tour) {
        throw new Error(`Tour not found: ${tourId}`);
      }

      if (tour.status !== 'ready') {
        throw new Error(`Tour not ready: ${tour.status}`);
      }

      const sessionId = this.generateSessionId();
      const session = {
        id: sessionId,
        tourId: tourId,
        userId: sessionData.userId,
        deviceInfo: sessionData.deviceInfo,
        startTime: new Date(),
        currentRoom: tour.content.rooms[0]?.id || null,
        visitedRooms: [],
        interactions: [],
        preferences: sessionData.preferences || {},
        arSupported: sessionData.arSupported || false,
        vrSupported: sessionData.vrSupported || false
      };

      this.tourSessions.set(sessionId, session);
      
      // Update tour analytics
      tour.analytics.totalViews++;
      if (!tour.analytics.visitors) {
        tour.analytics.visitors = new Set();
      }
      
      if (sessionData.userId && !tour.analytics.visitors.has(sessionData.userId)) {
        tour.analytics.visitors.add(sessionData.userId);
        tour.analytics.uniqueVisitors++;
      }

      this.logger.info(`Started tour session: ${sessionId} for tour ${tourId}`);
      
      return {
        success: true,
        sessionId: sessionId,
        tourData: this.prepareTourData(tour, session),
        supportedFeatures: this.getSupportedFeatures(sessionData.deviceInfo)
      };

    } catch (error) {
      this.logger.error('Error starting tour session:', error);
      throw error;
    }
  }

  prepareTourData(tour, session) {
    // Prepare optimized tour data based on device capabilities
    const optimizedTour = {
      id: tour.id,
      title: tour.title,
      description: tour.description,
      config: tour.config,
      
      rooms: tour.content.rooms.map(room => ({
        id: room.id,
        name: room.name,
        type: room.type,
        
        // Select appropriate image quality based on device
        panoramas: room.panoramas.map(pano => ({
          id: pano.id,
          location: pano.location,
          processed: this.selectOptimalImageQuality(pano.processed, session.deviceInfo),
          hotspots: pano.hotspots,
          rotation: pano.rotation
        })),
        
        photos: room.photos.slice(0, 5).map(photo => ({
          id: photo.id,
          location: photo.location,
          processed: this.selectOptimalImageQuality(photo.processed, session.deviceInfo)
        })),
        
        // Include AR assets if supported
        arAssets: session.arSupported ? room.arAssets : null
      })),
      
      floorPlans: tour.content.floorPlans.map(plan => ({
        id: plan.id,
        level: plan.level,
        processed: this.selectOptimalImageQuality(plan.processed, session.deviceInfo),
        roomLayout: plan.roomLayout,
        navigationPaths: plan.navigationPaths
      })),
      
      // Include AR assets if supported
      arAssets: session.arSupported ? tour.arAssets : null,
      
      // Navigation structure
      navigation: {
        startingRoom: tour.content.rooms[0]?.id || null,
        roomConnections: this.generateRoomConnections(tour.content.rooms)
      }
    };

    return optimizedTour;
  }

  selectOptimalImageQuality(processedImages, deviceInfo) {
    // Select appropriate image quality based on device capabilities
    const deviceType = this.classifyDevice(deviceInfo);
    
    const qualityMap = {
      'high_end_mobile': 'hd',
      'mid_range_mobile': 'medium',
      'low_end_mobile': 'mobile',
      'desktop': 'full',
      'tablet': 'hd'
    };

    const targetQuality = qualityMap[deviceType] || 'medium';
    
    // Return the processed image variant closest to target quality
    if (processedImages && processedImages.sizes) {
      return processedImages.sizes.find(size => size.label === targetQuality) || 
             processedImages.sizes[0];
    }

    return processedImages;
  }

  classifyDevice(deviceInfo) {
    // Simple device classification based on user agent and capabilities
    if (deviceInfo.type === 'desktop') {
      return 'desktop';
    }
    
    if (deviceInfo.type === 'tablet') {
      return 'tablet';
    }
    
    // Mobile classification based on performance indicators
    const performance = deviceInfo.performance || {};
    const memory = performance.memory || 4; // GB
    const cores = performance.cores || 4;
    
    if (memory >= 8 && cores >= 8) {
      return 'high_end_mobile';
    } else if (memory >= 4 && cores >= 4) {
      return 'mid_range_mobile';
    } else {
      return 'low_end_mobile';
    }
  }

  getSupportedFeatures(deviceInfo) {
    const features = {
      ar: false,
      vr: false,
      webxr: false,
      deviceMotion: false,
      geolocation: false,
      camera: false,
      microphone: false,
      fullscreen: true,
      webgl: true,
      webgl2: false
    };

    // Check for AR support
    if (deviceInfo.platform === 'ios' && deviceInfo.arkit) {
      features.ar = true;
    } else if (deviceInfo.platform === 'android' && deviceInfo.arcore) {
      features.ar = true;
    } else if (deviceInfo.webxr) {
      features.ar = true;
      features.webxr = true;
    }

    // Check for VR support
    if (deviceInfo.webxr || deviceInfo.webvr) {
      features.vr = true;
    }

    // Check for device capabilities
    features.deviceMotion = !!deviceInfo.deviceMotion;
    features.geolocation = !!deviceInfo.geolocation;
    features.camera = !!deviceInfo.camera;
    features.microphone = !!deviceInfo.microphone;
    features.webgl2 = !!deviceInfo.webgl2;

    return features;
  }

  async trackInteraction(sessionId, interactionData) {
    try {
      const session = this.tourSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const interaction = {
        type: interactionData.type,
        timestamp: new Date(),
        data: interactionData.data,
        roomId: session.currentRoom
      };

      session.interactions.push(interaction);
      
      // Update tour analytics
      const tour = this.tours.get(session.tourId);
      if (tour) {
        const heatmapKey = `${interaction.roomId}_${interaction.type}`;
        if (!tour.analytics.interactionHeatmap[heatmapKey]) {
          tour.analytics.interactionHeatmap[heatmapKey] = 0;
        }
        tour.analytics.interactionHeatmap[heatmapKey]++;
        
        // Track conversion events
        if (interaction.type === 'contact_agent' || interaction.type === 'schedule_viewing') {
          tour.analytics.conversionEvents.push({
            type: interaction.type,
            timestamp: new Date(),
            sessionId: sessionId
          });
        }
      }

      this.logger.debug(`Tracked interaction in session ${sessionId}:`, interaction);

    } catch (error) {
      this.logger.error('Error tracking interaction:', error);
    }
  }

  async endTourSession(sessionId) {
    try {
      const session = this.tourSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      session.endTime = new Date();
      session.duration = session.endTime - session.startTime;
      
      // Update tour analytics
      const tour = this.tours.get(session.tourId);
      if (tour) {
        // Update average session time
        const sessionTimeMs = session.duration;
        const totalSessions = tour.analytics.totalViews;
        tour.analytics.averageSessionTime = 
          ((tour.analytics.averageSessionTime * (totalSessions - 1)) + sessionTimeMs) / totalSessions;
      }

      // Archive session data
      await this.archiveSession(session);
      
      this.tourSessions.delete(sessionId);
      
      this.logger.info(`Ended tour session: ${sessionId}, duration: ${session.duration}ms`);

    } catch (error) {
      this.logger.error('Error ending tour session:', error);
    }
  }

  generateTourId(propertyId, tourType) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `tour_${propertyId}_${tourType}_${timestamp}${random}`;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  }

  generateRoomId(roomName) {
    return `room_${roomName.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substring(2, 8)}`;
  }

  generatePhotoId() {
    return `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  generatePanoramaId() {
    return `pano_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  generateFloorPlanId() {
    return `floor_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  generateAnchorId() {
    return `anchor_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }

  generateAnnotationId() {
    return `annotation_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }

  generateModelId() {
    return `model_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }

  generateHotspotId() {
    return `hotspot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }

  estimateProcessingTime(tourData) {
    const baseTime = 60000; // 1 minute base
    const photoTime = (tourData.photos?.length || 0) * 5000; // 5 seconds per photo
    const panoramaTime = (tourData.panoramas?.length || 0) * 15000; // 15 seconds per panorama
    const floorPlanTime = (tourData.floorPlans?.length || 0) * 10000; // 10 seconds per floor plan
    
    let multiplier = 1;
    if (tourData.enableVirtualStaging) multiplier += 0.5;
    if (tourData.enableAR) multiplier += 0.3;
    if (tourData.quality === 'ultra') multiplier += 0.4;
    
    return Math.round((baseTime + photoTime + panoramaTime + floorPlanTime) * multiplier);
  }

  async getTourStatus() {
    const status = {
      totalTours: this.tours.size,
      activeTours: 0,
      processingTours: 0,
      activeSessions: this.tourSessions.size,
      totalViews: 0,
      storageUsed: 0,
      tours: []
    };

    for (const [id, tour] of this.tours.entries()) {
      if (tour.status === 'ready') {
        status.activeTours++;
      } else if (tour.status === 'processing') {
        status.processingTours++;
      }

      status.totalViews += tour.analytics.totalViews;
      status.storageUsed += tour.metadata.totalSize;

      status.tours.push({
        id: tour.id,
        propertyId: tour.propertyId,
        title: tour.title,
        status: tour.status,
        progress: tour.progress,
        created: tour.createdAt,
        views: tour.analytics.totalViews,
        uniqueVisitors: tour.analytics.uniqueVisitors
      });
    }

    return status;
  }
}

class MediaProcessor {
  constructor() {
    this.logger = createLogger();
  }

  async processImage(imageData, options) {
    try {
      const processed = {
        formats: {},
        sizes: {},
        metadata: {}
      };

      // Mock image processing - in production this would use Sharp or similar
      for (const format of options.formats) {
        processed.formats[format] = {};
        
        for (const quality of options.qualities) {
          for (const size of options.sizes) {
            const filename = `${imageData.filename}_${size.label}_q${quality}.${format}`;
            
            processed.formats[format][`${size.label}_q${quality}`] = {
              url: `/processed/images/${filename}`,
              width: size.width,
              height: size.height,
              quality: quality,
              format: format,
              fileSize: Math.round(size.width * size.height * quality / 1000) // Mock file size
            };
          }
        }
      }

      // Group by size for easy access
      for (const size of options.sizes) {
        processed.sizes[size.label] = processed.formats.webp[`${size.label}_q90`];
      }

      return processed;

    } catch (error) {
      this.logger.error('Error processing image:', error);
      throw error;
    }
  }

  async process360Image(panoramaData, options) {
    try {
      // Process 360° panoramic image
      const processed = await this.processImage(panoramaData, options);
      
      // Add 360-specific processing
      processed.projection = options.projection;
      processed.fieldOfView = 360;
      processed.tiles = await this.generateTiles(panoramaData, options);
      
      return processed;

    } catch (error) {
      this.logger.error('Error processing 360° image:', error);
      throw error;
    }
  }

  async processFloorPlan(floorPlanData, options) {
    try {
      const processed = await this.processImage(floorPlanData, options);
      
      if (options.vectorize) {
        processed.vector = {
          svg: `/processed/floorplans/${floorPlanData.filename}.svg`,
          paths: [] // Mock room path extraction
        };
      }

      if (options.extractRooms) {
        processed.rooms = []; // Mock room detection
      }

      return processed;

    } catch (error) {
      this.logger.error('Error processing floor plan:', error);
      throw error;
    }
  }

  async generateTiles(panoramaData, options) {
    // Generate tiled versions for progressive loading
    const tiles = {
      levels: [],
      tileSize: 512
    };

    // Mock tile generation
    for (let level = 0; level < 4; level++) {
      const resolution = Math.pow(2, level);
      tiles.levels.push({
        level: level,
        resolution: resolution,
        columns: resolution * 2,
        rows: resolution,
        tiles: []
      });
    }

    return tiles;
  }
}

module.exports = ARPropertyTourService;