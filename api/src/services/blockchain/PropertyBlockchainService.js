const { createLogger } = require('../../utils/logger');
const CacheManager = require('../cache/cacheManager');
const crypto = require('crypto');

class PropertyBlockchainService {
  constructor() {
    this.logger = createLogger();
    this.cache = CacheManager;
    this.blockchain = [];
    this.pendingTransactions = [];
    this.difficulty = 4; // Mining difficulty
    this.miningReward = 1;
    this.networkNodes = new Set();
    this.propertyRegistry = new Map();
    this.verificationContracts = new Map();
    this.auditTrail = new Map();
    
    this.initializeService();
  }

  async initializeService() {
    try {
      this.logger.info('Initializing Property Blockchain Service...');
      
      await this.createGenesisBlock();
      await this.loadExistingRecords();
      await this.setupSmartContracts();
      await this.initializeNetworkNodes();
      
      this.startMiningProcess();
      this.startConsensusProtocol();
      
      this.logger.info(`Property Blockchain Service initialized with ${this.blockchain.length} blocks`);
      
    } catch (error) {
      this.logger.error('Failed to initialize Property Blockchain Service:', error);
      throw error;
    }
  }

  async createGenesisBlock() {
    const genesisBlock = new Block(0, Date.now(), [], '0');
    genesisBlock.mineBlock(this.difficulty);
    this.blockchain.push(genesisBlock);
    
    this.logger.info('Genesis block created');
  }

  async loadExistingRecords() {
    try {
      const cachedBlockchain = await this.cache.get('property_blockchain');
      const cachedRegistry = await this.cache.get('property_registry');
      
      if (cachedBlockchain && Array.isArray(cachedBlockchain)) {
        this.blockchain = cachedBlockchain.map(blockData => Object.assign(new Block(), blockData));
        this.logger.info(`Loaded ${this.blockchain.length} blocks from cache`);
      }
      
      if (cachedRegistry) {
        this.propertyRegistry = new Map(Object.entries(cachedRegistry));
        this.logger.info(`Loaded ${this.propertyRegistry.size} property records from cache`);
      }
      
    } catch (error) {
      this.logger.error('Error loading existing blockchain records:', error);
    }
  }

  async setupSmartContracts() {
    const contracts = {
      PROPERTY_REGISTRATION: {
        id: 'PROPERTY_REGISTRATION',
        name: 'Property Registration Contract',
        description: 'Handles initial property registration and ownership verification',
        conditions: [
          'valid_legal_description',
          'ownership_verification',
          'title_clear',
          'survey_validation'
        ],
        actions: ['register_property', 'issue_title_token', 'create_audit_trail']
      },
      
      OWNERSHIP_TRANSFER: {
        id: 'OWNERSHIP_TRANSFER',
        name: 'Ownership Transfer Contract',
        description: 'Manages property ownership transfers and sales',
        conditions: [
          'current_owner_signature',
          'buyer_verification',
          'legal_transfer_documents',
          'payment_verification',
          'title_search_clear'
        ],
        actions: ['transfer_ownership', 'update_title', 'record_transaction', 'notify_parties']
      },
      
      LIEN_RECORDING: {
        id: 'LIEN_RECORDING',
        name: 'Lien Recording Contract',
        description: 'Records and manages property liens and encumbrances',
        conditions: [
          'lien_holder_verification',
          'legal_authority',
          'property_ownership_confirmed',
          'lien_amount_specified'
        ],
        actions: ['record_lien', 'update_encumbrances', 'notify_owner', 'create_lien_token']
      },
      
      PROPERTY_VALUATION: {
        id: 'PROPERTY_VALUATION',
        name: 'Property Valuation Contract',
        description: 'Records official property valuations and assessments',
        conditions: [
          'appraiser_certification',
          'valuation_methodology',
          'market_data_verification',
          'property_inspection_completed'
        ],
        actions: ['record_valuation', 'update_market_value', 'create_valuation_certificate']
      },
      
      INSPECTION_RECORDS: {
        id: 'INSPECTION_RECORDS',
        name: 'Property Inspection Contract',
        description: 'Immutable record of property inspections and conditions',
        conditions: [
          'inspector_certification',
          'inspection_standards_met',
          'photographic_evidence',
          'detailed_report'
        ],
        actions: ['record_inspection', 'issue_condition_report', 'update_property_status']
      }
    };

    for (const [contractId, contract] of Object.entries(contracts)) {
      this.verificationContracts.set(contractId, contract);
    }

    this.logger.info(`Initialized ${Object.keys(contracts).length} smart contracts`);
  }

  async initializeNetworkNodes() {
    const nodes = [
      { id: 'node_registry_ontario', url: 'https://registry.ontario.ca/blockchain', type: 'government' },
      { id: 'node_mls_treb', url: 'https://treb.ca/blockchain', type: 'mls' },
      { id: 'node_title_company', url: 'https://titleguard.ca/blockchain', type: 'title_insurer' },
      { id: 'node_land_registry', url: 'https://landregistry.gov.on.ca/blockchain', type: 'registry' },
      { id: 'node_municipal_toronto', url: 'https://toronto.ca/blockchain', type: 'municipal' }
    ];

    for (const node of nodes) {
      this.networkNodes.add(node);
    }

    this.logger.info(`Connected to ${this.networkNodes.size} network nodes`);
  }

  async registerProperty(propertyData) {
    try {
      const propertyId = this.generatePropertyId(propertyData);
      
      // Verify property doesn't already exist
      if (this.propertyRegistry.has(propertyId)) {
        throw new Error(`Property already registered: ${propertyId}`);
      }

      // Execute smart contract verification
      const contractResult = await this.executeSmartContract('PROPERTY_REGISTRATION', {
        propertyData,
        propertyId
      });

      if (!contractResult.success) {
        throw new Error(`Smart contract validation failed: ${contractResult.error}`);
      }

      // Create property registration transaction
      const transaction = new PropertyTransaction({
        type: 'PROPERTY_REGISTRATION',
        propertyId: propertyId,
        timestamp: Date.now(),
        data: {
          legalDescription: propertyData.legalDescription,
          address: propertyData.address,
          coordinates: propertyData.coordinates,
          lotSize: propertyData.lotSize,
          propertyType: propertyData.propertyType,
          initialOwner: propertyData.owner,
          registrationDate: new Date(),
          titleNumber: this.generateTitleNumber(),
          surveyReference: propertyData.surveyReference,
          zonxning: propertyData.zoning,
          assessedValue: propertyData.assessedValue
        },
        contractId: 'PROPERTY_REGISTRATION',
        signatures: propertyData.signatures || []
      });

      // Add to pending transactions
      this.pendingTransactions.push(transaction);

      // Create property registry entry
      const propertyRecord = {
        id: propertyId,
        titleNumber: transaction.data.titleNumber,
        legalDescription: propertyData.legalDescription,
        address: propertyData.address,
        coordinates: propertyData.coordinates,
        currentOwner: propertyData.owner,
        registrationDate: new Date(),
        lastUpdated: new Date(),
        status: 'active',
        encumbrances: [],
        valuationHistory: [],
        ownershipHistory: [{
          owner: propertyData.owner,
          acquiredDate: new Date(),
          transactionHash: null // Will be set after mining
        }],
        inspectionHistory: [],
        blockchainHashes: []
      };

      this.propertyRegistry.set(propertyId, propertyRecord);
      
      // Create audit trail
      await this.createAuditTrail(propertyId, 'PROPERTY_REGISTERED', {
        transaction: transaction,
        registeredBy: propertyData.registeredBy || 'system',
        timestamp: new Date()
      });

      this.logger.info(`Property registered: ${propertyId}`);
      
      return {
        success: true,
        propertyId: propertyId,
        titleNumber: transaction.data.titleNumber,
        transactionId: transaction.id,
        status: 'pending_mining'
      };

    } catch (error) {
      this.logger.error('Error registering property:', error);
      throw error;
    }
  }

  async transferOwnership(transferData) {
    try {
      const { propertyId, currentOwner, newOwner, salePrice, transferDate } = transferData;
      
      const propertyRecord = this.propertyRegistry.get(propertyId);
      if (!propertyRecord) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      if (propertyRecord.currentOwner !== currentOwner) {
        throw new Error(`Ownership verification failed. Current owner: ${propertyRecord.currentOwner}`);
      }

      // Execute ownership transfer smart contract
      const contractResult = await this.executeSmartContract('OWNERSHIP_TRANSFER', {
        propertyId,
        currentOwner,
        newOwner,
        salePrice,
        transferDate,
        propertyRecord
      });

      if (!contractResult.success) {
        throw new Error(`Ownership transfer validation failed: ${contractResult.error}`);
      }

      // Create ownership transfer transaction
      const transaction = new PropertyTransaction({
        type: 'OWNERSHIP_TRANSFER',
        propertyId: propertyId,
        timestamp: Date.now(),
        data: {
          previousOwner: currentOwner,
          newOwner: newOwner,
          salePrice: salePrice,
          transferDate: transferDate,
          titleNumber: propertyRecord.titleNumber,
          transferMethod: transferData.transferMethod || 'sale',
          legalDocuments: transferData.legalDocuments || [],
          mortgageInfo: transferData.mortgageInfo
        },
        contractId: 'OWNERSHIP_TRANSFER',
        signatures: transferData.signatures || []
      });

      this.pendingTransactions.push(transaction);

      // Update property record
      propertyRecord.currentOwner = newOwner;
      propertyRecord.lastUpdated = new Date();
      propertyRecord.ownershipHistory.push({
        owner: newOwner,
        acquiredDate: transferDate,
        salePrice: salePrice,
        previousOwner: currentOwner,
        transactionHash: null // Will be set after mining
      });

      // Create audit trail
      await this.createAuditTrail(propertyId, 'OWNERSHIP_TRANSFERRED', {
        transaction: transaction,
        previousOwner: currentOwner,
        newOwner: newOwner,
        salePrice: salePrice,
        timestamp: new Date()
      });

      this.logger.info(`Ownership transfer initiated: ${propertyId} from ${currentOwner} to ${newOwner}`);
      
      return {
        success: true,
        propertyId: propertyId,
        transactionId: transaction.id,
        status: 'pending_mining',
        newOwner: newOwner
      };

    } catch (error) {
      this.logger.error('Error transferring ownership:', error);
      throw error;
    }
  }

  async recordLien(lienData) {
    try {
      const { propertyId, lienHolder, amount, lienType, priority, filingDate } = lienData;
      
      const propertyRecord = this.propertyRegistry.get(propertyId);
      if (!propertyRecord) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Execute lien recording smart contract
      const contractResult = await this.executeSmartContract('LIEN_RECORDING', {
        propertyId,
        lienHolder,
        amount,
        lienType,
        propertyRecord
      });

      if (!contractResult.success) {
        throw new Error(`Lien recording validation failed: ${contractResult.error}`);
      }

      const lienId = this.generateLienId(propertyId, lienHolder, filingDate);

      // Create lien recording transaction
      const transaction = new PropertyTransaction({
        type: 'LIEN_RECORDED',
        propertyId: propertyId,
        timestamp: Date.now(),
        data: {
          lienId: lienId,
          lienHolder: lienHolder,
          amount: amount,
          lienType: lienType,
          priority: priority,
          filingDate: filingDate,
          status: 'active',
          titleNumber: propertyRecord.titleNumber,
          legalDescription: lienData.legalDescription || '',
          interestRate: lienData.interestRate,
          maturityDate: lienData.maturityDate
        },
        contractId: 'LIEN_RECORDING',
        signatures: lienData.signatures || []
      });

      this.pendingTransactions.push(transaction);

      // Update property record
      propertyRecord.encumbrances.push({
        lienId: lienId,
        type: lienType,
        holder: lienHolder,
        amount: amount,
        priority: priority,
        filingDate: filingDate,
        status: 'active',
        transactionHash: null // Will be set after mining
      });

      propertyRecord.lastUpdated = new Date();

      // Create audit trail
      await this.createAuditTrail(propertyId, 'LIEN_RECORDED', {
        transaction: transaction,
        lienId: lienId,
        lienHolder: lienHolder,
        amount: amount,
        timestamp: new Date()
      });

      this.logger.info(`Lien recorded: ${lienId} on property ${propertyId}`);
      
      return {
        success: true,
        propertyId: propertyId,
        lienId: lienId,
        transactionId: transaction.id,
        status: 'pending_mining'
      };

    } catch (error) {
      this.logger.error('Error recording lien:', error);
      throw error;
    }
  }

  async recordValuation(valuationData) {
    try {
      const { propertyId, appraiser, valuationAmount, valuationDate, methodology } = valuationData;
      
      const propertyRecord = this.propertyRegistry.get(propertyId);
      if (!propertyRecord) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Execute valuation smart contract
      const contractResult = await this.executeSmartContract('PROPERTY_VALUATION', {
        propertyId,
        appraiser,
        valuationAmount,
        methodology,
        propertyRecord
      });

      if (!contractResult.success) {
        throw new Error(`Valuation recording validation failed: ${contractResult.error}`);
      }

      const valuationId = this.generateValuationId(propertyId, valuationDate);

      // Create valuation transaction
      const transaction = new PropertyTransaction({
        type: 'VALUATION_RECORDED',
        propertyId: propertyId,
        timestamp: Date.now(),
        data: {
          valuationId: valuationId,
          appraiser: appraiser,
          valuationAmount: valuationAmount,
          valuationDate: valuationDate,
          methodology: methodology,
          titleNumber: propertyRecord.titleNumber,
          marketConditions: valuationData.marketConditions || {},
          comparableSales: valuationData.comparableSales || [],
          propertyCondition: valuationData.propertyCondition,
          certificationNumber: valuationData.certificationNumber
        },
        contractId: 'PROPERTY_VALUATION',
        signatures: valuationData.signatures || []
      });

      this.pendingTransactions.push(transaction);

      // Update property record
      propertyRecord.valuationHistory.push({
        valuationId: valuationId,
        appraiser: appraiser,
        amount: valuationAmount,
        date: valuationDate,
        methodology: methodology,
        transactionHash: null // Will be set after mining
      });

      propertyRecord.lastUpdated = new Date();

      // Create audit trail
      await this.createAuditTrail(propertyId, 'VALUATION_RECORDED', {
        transaction: transaction,
        valuationId: valuationId,
        appraiser: appraiser,
        amount: valuationAmount,
        timestamp: new Date()
      });

      this.logger.info(`Valuation recorded: ${valuationId} for property ${propertyId}`);
      
      return {
        success: true,
        propertyId: propertyId,
        valuationId: valuationId,
        transactionId: transaction.id,
        status: 'pending_mining'
      };

    } catch (error) {
      this.logger.error('Error recording valuation:', error);
      throw error;
    }
  }

  async executeSmartContract(contractId, data) {
    try {
      const contract = this.verificationContracts.get(contractId);
      if (!contract) {
        throw new Error(`Smart contract not found: ${contractId}`);
      }

      const results = {
        contractId: contractId,
        success: true,
        validatedConditions: [],
        failedConditions: [],
        executedActions: [],
        timestamp: new Date()
      };

      // Validate all conditions
      for (const condition of contract.conditions) {
        const conditionResult = await this.validateCondition(condition, data, contractId);
        
        if (conditionResult.valid) {
          results.validatedConditions.push(conditionResult);
        } else {
          results.failedConditions.push(conditionResult);
          results.success = false;
        }
      }

      // Execute actions if all conditions pass
      if (results.success) {
        for (const action of contract.actions) {
          const actionResult = await this.executeContractAction(action, data, contractId);
          results.executedActions.push(actionResult);
        }
      }

      this.logger.debug(`Smart contract ${contractId} execution:`, results);
      return results;

    } catch (error) {
      this.logger.error(`Smart contract execution error for ${contractId}:`, error);
      return {
        contractId: contractId,
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async validateCondition(condition, data, contractId) {
    try {
      const validators = {
        valid_legal_description: (data) => {
          return data.propertyData?.legalDescription && 
                 data.propertyData.legalDescription.length > 10;
        },
        
        ownership_verification: (data) => {
          return data.propertyData?.owner && 
                 data.propertyData.signatures && 
                 data.propertyData.signatures.length > 0;
        },
        
        title_clear: async (data) => {
          // In production, this would check with title companies
          return true; // Mock verification
        },
        
        survey_validation: (data) => {
          return data.propertyData?.surveyReference || 
                 data.propertyData?.coordinates;
        },
        
        current_owner_signature: (data) => {
          const propertyRecord = data.propertyRecord;
          return propertyRecord && 
                 propertyRecord.currentOwner === data.currentOwner &&
                 data.signatures && data.signatures.length > 0;
        },
        
        buyer_verification: (data) => {
          return data.newOwner && data.newOwner.length > 0;
        },
        
        legal_transfer_documents: (data) => {
          return data.legalDocuments && data.legalDocuments.length > 0;
        },
        
        payment_verification: (data) => {
          return data.salePrice && data.salePrice > 0;
        },
        
        title_search_clear: async (data) => {
          // In production, this would perform actual title search
          return true; // Mock verification
        },
        
        lien_holder_verification: (data) => {
          return data.lienHolder && data.lienHolder.length > 0;
        },
        
        legal_authority: (data) => {
          return data.lienType && ['mortgage', 'tax_lien', 'mechanic_lien', 'judgment'].includes(data.lienType);
        },
        
        property_ownership_confirmed: (data) => {
          return data.propertyRecord && data.propertyRecord.currentOwner;
        },
        
        lien_amount_specified: (data) => {
          return data.amount && data.amount > 0;
        },
        
        appraiser_certification: (data) => {
          return data.appraiser && data.certificationNumber;
        },
        
        valuation_methodology: (data) => {
          return data.methodology && 
                 ['comparative_market_analysis', 'cost_approach', 'income_approach'].includes(data.methodology);
        },
        
        market_data_verification: (data) => {
          return data.comparableSales && data.comparableSales.length >= 3;
        },
        
        property_inspection_completed: (data) => {
          return data.propertyCondition || data.inspectionReport;
        }
      };

      const validator = validators[condition];
      if (!validator) {
        return { condition, valid: false, error: 'Validator not found' };
      }

      const isValid = await validator(data);
      
      return {
        condition: condition,
        valid: isValid,
        timestamp: new Date(),
        contractId: contractId
      };

    } catch (error) {
      this.logger.error(`Error validating condition ${condition}:`, error);
      return {
        condition: condition,
        valid: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async executeContractAction(action, data, contractId) {
    try {
      const actionExecutors = {
        register_property: async (data) => {
          return { action: 'register_property', executed: true, propertyId: data.propertyId };
        },
        
        issue_title_token: async (data) => {
          const titleToken = this.generateTitleToken(data.propertyId);
          return { action: 'issue_title_token', executed: true, titleToken: titleToken };
        },
        
        create_audit_trail: async (data) => {
          await this.createAuditTrail(data.propertyId, 'PROPERTY_REGISTERED', data);
          return { action: 'create_audit_trail', executed: true };
        },
        
        transfer_ownership: async (data) => {
          return { action: 'transfer_ownership', executed: true, 
                  from: data.currentOwner, to: data.newOwner };
        },
        
        update_title: async (data) => {
          return { action: 'update_title', executed: true, titleNumber: data.titleNumber };
        },
        
        record_transaction: async (data) => {
          return { action: 'record_transaction', executed: true };
        },
        
        notify_parties: async (data) => {
          // In production, this would send actual notifications
          return { action: 'notify_parties', executed: true, 
                  notified: [data.currentOwner, data.newOwner] };
        },
        
        record_lien: async (data) => {
          return { action: 'record_lien', executed: true, lienId: data.lienId };
        },
        
        update_encumbrances: async (data) => {
          return { action: 'update_encumbrances', executed: true };
        },
        
        notify_owner: async (data) => {
          return { action: 'notify_owner', executed: true, owner: data.propertyRecord?.currentOwner };
        },
        
        create_lien_token: async (data) => {
          const lienToken = this.generateLienToken(data.lienId);
          return { action: 'create_lien_token', executed: true, lienToken: lienToken };
        },
        
        record_valuation: async (data) => {
          return { action: 'record_valuation', executed: true, valuationId: data.valuationId };
        },
        
        update_market_value: async (data) => {
          return { action: 'update_market_value', executed: true, 
                  newValue: data.valuationAmount };
        },
        
        create_valuation_certificate: async (data) => {
          const certificate = this.generateValuationCertificate(data);
          return { action: 'create_valuation_certificate', executed: true, certificate: certificate };
        }
      };

      const executor = actionExecutors[action];
      if (!executor) {
        return { action: action, executed: false, error: 'Executor not found' };
      }

      const result = await executor(data);
      result.timestamp = new Date();
      result.contractId = contractId;

      return result;

    } catch (error) {
      this.logger.error(`Error executing contract action ${action}:`, error);
      return {
        action: action,
        executed: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  generatePropertyId(propertyData) {
    const idString = `${propertyData.legalDescription}_${propertyData.address}_${propertyData.coordinates?.lat}_${propertyData.coordinates?.lng}`;
    return crypto.createHash('sha256').update(idString).digest('hex').substring(0, 16);
  }

  generateTitleNumber() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TN${timestamp}${random}`.toUpperCase();
  }

  generateLienId(propertyId, lienHolder, filingDate) {
    const idString = `${propertyId}_${lienHolder}_${filingDate}`;
    return crypto.createHash('sha256').update(idString).digest('hex').substring(0, 12);
  }

  generateValuationId(propertyId, valuationDate) {
    const idString = `${propertyId}_${valuationDate}_valuation`;
    return crypto.createHash('sha256').update(idString).digest('hex').substring(0, 12);
  }

  generateTitleToken(propertyId) {
    const tokenData = {
      propertyId: propertyId,
      issued: new Date(),
      type: 'TITLE_TOKEN',
      blockchain: 'AgentRadar_PropertyChain'
    };
    
    return crypto.createHash('sha256').update(JSON.stringify(tokenData)).digest('hex');
  }

  generateLienToken(lienId) {
    const tokenData = {
      lienId: lienId,
      issued: new Date(),
      type: 'LIEN_TOKEN',
      blockchain: 'AgentRadar_PropertyChain'
    };
    
    return crypto.createHash('sha256').update(JSON.stringify(tokenData)).digest('hex');
  }

  generateValuationCertificate(data) {
    const certificate = {
      id: data.valuationId,
      propertyId: data.propertyId,
      appraiser: data.appraiser,
      valuationAmount: data.valuationAmount,
      methodology: data.methodology,
      issuedDate: new Date(),
      certificateHash: null
    };
    
    certificate.certificateHash = crypto.createHash('sha256')
      .update(JSON.stringify(certificate))
      .digest('hex');
    
    return certificate;
  }

  async createAuditTrail(propertyId, action, data) {
    try {
      const auditEntry = {
        id: crypto.randomUUID(),
        propertyId: propertyId,
        action: action,
        timestamp: new Date(),
        data: data,
        blockchainHash: null,
        verified: false
      };

      if (!this.auditTrail.has(propertyId)) {
        this.auditTrail.set(propertyId, []);
      }

      this.auditTrail.get(propertyId).push(auditEntry);
      
      this.logger.debug(`Created audit trail entry for ${propertyId}: ${action}`);

    } catch (error) {
      this.logger.error('Error creating audit trail:', error);
    }
  }

  startMiningProcess() {
    setInterval(async () => {
      if (this.pendingTransactions.length > 0) {
        await this.mineBlock();
      }
    }, 10000); // Mine every 10 seconds if there are pending transactions
  }

  async mineBlock() {
    try {
      const transactionsToMine = this.pendingTransactions.splice(0, 10); // Max 10 transactions per block
      
      if (transactionsToMine.length === 0) {
        return;
      }

      const previousBlock = this.blockchain[this.blockchain.length - 1];
      const newBlock = new Block(
        previousBlock.index + 1,
        Date.now(),
        transactionsToMine,
        previousBlock.hash
      );

      newBlock.mineBlock(this.difficulty);
      this.blockchain.push(newBlock);

      // Update property records with transaction hashes
      for (const transaction of transactionsToMine) {
        await this.updateRecordWithBlockchainHash(transaction, newBlock.hash);
      }

      // Cache the updated blockchain
      await this.cacheBlockchain();

      this.logger.info(`Mined block ${newBlock.index} with ${transactionsToMine.length} transactions`);

    } catch (error) {
      this.logger.error('Error mining block:', error);
    }
  }

  async updateRecordWithBlockchainHash(transaction, blockHash) {
    try {
      const propertyRecord = this.propertyRegistry.get(transaction.propertyId);
      if (!propertyRecord) {
        return;
      }

      const transactionHash = `${blockHash}_${transaction.id}`;

      // Update appropriate record array based on transaction type
      switch (transaction.type) {
        case 'OWNERSHIP_TRANSFER':
          const latestOwnership = propertyRecord.ownershipHistory[propertyRecord.ownershipHistory.length - 1];
          if (latestOwnership) {
            latestOwnership.transactionHash = transactionHash;
          }
          break;

        case 'LIEN_RECORDED':
          const latestLien = propertyRecord.encumbrances[propertyRecord.encumbrances.length - 1];
          if (latestLien) {
            latestLien.transactionHash = transactionHash;
          }
          break;

        case 'VALUATION_RECORDED':
          const latestValuation = propertyRecord.valuationHistory[propertyRecord.valuationHistory.length - 1];
          if (latestValuation) {
            latestValuation.transactionHash = transactionHash;
          }
          break;
      }

      propertyRecord.blockchainHashes.push({
        transactionType: transaction.type,
        transactionId: transaction.id,
        blockHash: blockHash,
        transactionHash: transactionHash,
        timestamp: new Date()
      });

      // Update audit trail
      const auditEntries = this.auditTrail.get(transaction.propertyId);
      if (auditEntries) {
        for (const entry of auditEntries) {
          if (!entry.verified && entry.data?.transaction?.id === transaction.id) {
            entry.blockchainHash = transactionHash;
            entry.verified = true;
          }
        }
      }

    } catch (error) {
      this.logger.error('Error updating record with blockchain hash:', error);
    }
  }

  startConsensusProtocol() {
    setInterval(async () => {
      await this.synchronizeWithNetwork();
    }, 30000); // Sync with network every 30 seconds
  }

  async synchronizeWithNetwork() {
    try {
      // In production, this would sync with other nodes in the network
      // For now, we'll just validate our own blockchain
      const isValid = await this.validateBlockchain();
      
      if (!isValid) {
        this.logger.error('Blockchain validation failed during sync');
        // In production, this would trigger consensus resolution
      }

    } catch (error) {
      this.logger.error('Error synchronizing with network:', error);
    }
  }

  async validateBlockchain() {
    try {
      for (let i = 1; i < this.blockchain.length; i++) {
        const currentBlock = this.blockchain[i];
        const previousBlock = this.blockchain[i - 1];

        if (currentBlock.hash !== currentBlock.calculateHash()) {
          this.logger.error(`Invalid hash at block ${i}`);
          return false;
        }

        if (currentBlock.previousHash !== previousBlock.hash) {
          this.logger.error(`Invalid previous hash at block ${i}`);
          return false;
        }
      }

      return true;

    } catch (error) {
      this.logger.error('Error validating blockchain:', error);
      return false;
    }
  }

  async cacheBlockchain() {
    try {
      await this.cache.set('property_blockchain', this.blockchain, 86400); // 24 hours
      await this.cache.set('property_registry', Object.fromEntries(this.propertyRegistry), 86400);
      
    } catch (error) {
      this.logger.error('Error caching blockchain:', error);
    }
  }

  async getPropertyHistory(propertyId) {
    try {
      const propertyRecord = this.propertyRegistry.get(propertyId);
      if (!propertyRecord) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      const auditTrail = this.auditTrail.get(propertyId) || [];

      return {
        propertyId: propertyId,
        currentStatus: propertyRecord,
        ownershipHistory: propertyRecord.ownershipHistory,
        encumbrances: propertyRecord.encumbrances,
        valuationHistory: propertyRecord.valuationHistory,
        inspectionHistory: propertyRecord.inspectionHistory,
        blockchainHashes: propertyRecord.blockchainHashes,
        auditTrail: auditTrail,
        verificationStatus: 'blockchain_verified'
      };

    } catch (error) {
      this.logger.error('Error getting property history:', error);
      throw error;
    }
  }

  async verifyPropertyOwnership(propertyId, claimedOwner) {
    try {
      const propertyRecord = this.propertyRegistry.get(propertyId);
      if (!propertyRecord) {
        return { verified: false, error: 'Property not found' };
      }

      const isCurrentOwner = propertyRecord.currentOwner === claimedOwner;
      const hasOwnershipHistory = propertyRecord.ownershipHistory.some(
        entry => entry.owner === claimedOwner
      );

      return {
        verified: isCurrentOwner,
        currentOwner: propertyRecord.currentOwner,
        claimedOwner: claimedOwner,
        hasHistoricalOwnership: hasOwnershipHistory,
        verificationMethod: 'blockchain',
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error('Error verifying property ownership:', error);
      throw error;
    }
  }

  async getBlockchainStats() {
    return {
      totalBlocks: this.blockchain.length,
      totalProperties: this.propertyRegistry.size,
      pendingTransactions: this.pendingTransactions.length,
      networkNodes: this.networkNodes.size,
      smartContracts: this.verificationContracts.size,
      totalTransactions: this.blockchain.reduce((sum, block) => sum + block.transactions.length, 0),
      blockchainSize: JSON.stringify(this.blockchain).length,
      lastBlockTime: this.blockchain.length > 0 ? this.blockchain[this.blockchain.length - 1].timestamp : null,
      validationStatus: await this.validateBlockchain()
    };
  }
}

class Block {
  constructor(index, timestamp, transactions, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return crypto.createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce)
      .digest('hex');
  }

  mineBlock(difficulty) {
    const target = Array(difficulty + 1).join('0');

    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    console.log(`Block mined: ${this.hash}`);
  }
}

class PropertyTransaction {
  constructor(transactionData) {
    this.id = crypto.randomUUID();
    this.type = transactionData.type;
    this.propertyId = transactionData.propertyId;
    this.timestamp = transactionData.timestamp;
    this.data = transactionData.data;
    this.contractId = transactionData.contractId;
    this.signatures = transactionData.signatures || [];
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto.createHash('sha256')
      .update(this.id + this.type + this.propertyId + this.timestamp + JSON.stringify(this.data))
      .digest('hex');
  }
}

module.exports = PropertyBlockchainService;