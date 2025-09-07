# Claude Swarm Setup for AgentRadar

## Overview

This project uses **claude-swarm** to orchestrate multiple specialized AI agents for collaborative development of the AgentRadar real estate intelligence platform.

## Quick Start

```bash
# Start the full development swarm
./scripts/start-swarm.sh

# Start with all tools enabled (vibe mode)
./scripts/start-swarm.sh --vibe

# Start a specific agent
./scripts/start-swarm.sh --agent frontend

# Debug mode
./scripts/start-swarm.sh --debug
```

## Agent Specialists

### 🎯 Lead Agent (`lead`)
- **Role**: Team coordinator and system architect
- **Access**: Full codebase
- **Responsibilities**: 
  - High-level architecture decisions
  - Task delegation to specialist agents
  - Integration coordination
  - Code review and quality assurance

### 🎨 Frontend Agent (`frontend`)
- **Role**: UI/UX specialist for all platforms
- **Access**: `web-app/`, `mobile/`, `desktop/`
- **Expertise**: Next.js, React Native, Electron, Tailwind CSS
- **Responsibilities**:
  - Web application development
  - Mobile app features
  - Desktop application
  - UI component library

### ⚙️ Backend Agent (`backend`)
- **Role**: API and database specialist
- **Access**: `api/`, database schemas
- **Expertise**: Node.js, PostgreSQL, Prisma, Redis
- **Responsibilities**:
  - API endpoints
  - Database design
  - Authentication & authorization
  - Real-time features (WebSockets)

### 🕷️ Scraper Agent (`scraper`)
- **Role**: Data collection and processing
- **Access**: `scrapers/`, `mcp-integrations/`
- **Expertise**: Web scraping, Puppeteer, data extraction
- **Responsibilities**:
  - Court filing scrapers
  - Estate sale monitors
  - Development application trackers
  - Data normalization

### 🔌 MCP Agent (`mcp`)
- **Role**: Claude MCP integration specialist
- **Access**: `mcp-integrations/`, `.mcp.json`
- **Expertise**: Model Context Protocol, Claude tools
- **Responsibilities**:
  - MCP server development
  - Tool implementation
  - Claude integration
  - Protocol optimization

### 📱 Mobile Agent (`mobile`)
- **Role**: iOS and Android specialist
- **Access**: `mobile/`
- **Expertise**: React Native, Expo, native modules
- **Responsibilities**:
  - Platform-specific features
  - Push notifications
  - Mobile optimization
  - App store deployments

### 🚀 DevOps Agent (`devops`)
- **Role**: Infrastructure and deployment
- **Access**: `scripts/`, CI/CD configs, Docker files
- **Expertise**: Docker, Kubernetes, GitHub Actions
- **Responsibilities**:
  - White-label deployments
  - CI/CD pipelines
  - Infrastructure as code
  - Monitoring and logging

## Configuration

The swarm configuration is defined in `swarm.yml`. Key settings:

- **Model Selection**: Lead uses Opus, specialists use Sonnet
- **Connections**: Agents can delegate tasks to connected agents
- **Permissions**: Each agent has specific read/write/execute permissions
- **Tools**: Agents have access to appropriate development tools

## Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/agentradar

# Redis
REDIS_URL=redis://localhost:6379

# API
NEXT_PUBLIC_API_URL=http://localhost:4000

# Development
ENABLE_MOCK_DATA=true

# Claude API (if needed)
ANTHROPIC_API_KEY=your-api-key
```

## Workflow Examples

### 1. Adding a New Feature

```bash
# Start the swarm
./scripts/start-swarm.sh

# In the lead agent:
# "Implement a new feature for tracking property price history"
# The lead will delegate to appropriate specialists
```

### 2. Fixing a Bug

```bash
# Start specific agents
./scripts/start-swarm.sh --agent backend

# "Fix the authentication issue in the API login endpoint"
```

### 3. White-Label Setup

```bash
# Start devops specialist
./scripts/start-swarm.sh --agent devops

# "Set up a new white-label instance for Acme Realty"
```

## Agent Communication

Agents communicate through the swarm protocol:
- Lead agent can delegate tasks to any specialist
- Specialists can request help from connected agents
- All agents share the knowledge base (documentation)

## Best Practices

1. **Start with the Lead**: For complex features, let the lead coordinate
2. **Use Specialists Directly**: For focused tasks, start the specific agent
3. **Enable Debug Mode**: Use `--debug` for troubleshooting
4. **Monitor Progress**: Agents update their todo lists automatically
5. **Review Generated Code**: Always review AI-generated code before deployment

## Troubleshooting

### Swarm won't start
```bash
# Check Ruby version (needs 3.2.0+)
ruby --version

# Reinstall claude-swarm
gem uninstall claude_swarm
gem install claude_swarm
```

### Agent connection issues
```bash
# Verify swarm.yml syntax
ruby -ryaml -e "YAML.load_file('swarm.yml')"

# Check environment variables
./scripts/start-swarm.sh --debug
```

### Performance issues
- Reduce `max_context_size` in swarm.yml
- Use specific agents instead of full swarm
- Enable checkpointing for long sessions

## Integration with Existing Workflows

The swarm integrates with the existing Claude team workflows:

```bash
# Traditional Claude session
npm run claude:start feature-xyz branch-name JIRA-123

# Swarm session for complex features
./scripts/start-swarm.sh --vibe

# Both can be used together
```

## Advanced Usage

### Custom Agent Configurations

Edit `swarm.yml` to:
- Add new agents
- Modify permissions
- Change model assignments
- Update tool access

### Logging and Monitoring

Swarm logs are stored in:
- `logs/swarm-session-*.log` - Session logs
- `.claude/swarm-history/` - Agent interaction history

### Performance Tuning

Optimize swarm performance:
```yaml
# In swarm.yml
config:
  max_context_size: 50000  # Reduce for faster responses
  checkpoint_interval: 180  # More frequent checkpoints
  verbose: false           # Disable verbose logging
```

## Security Considerations

- Never commit API keys to the repository
- Use environment variables for sensitive data
- Review agent permissions regularly
- Monitor agent activities in production environments

## Support

For issues or questions:
1. Check the [claude-swarm documentation](https://github.com/parruda/claude-swarm)
2. Review agent logs in `logs/`
3. Use debug mode for detailed output
4. Contact the team lead for assistance