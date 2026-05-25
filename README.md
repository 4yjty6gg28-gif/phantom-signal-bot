# Phantom Signal Bot

AI-powered trading signal system with multi-model consensus voting.

## Features

- **Multi-AI Voting**: Uses Kimi K2, Claude 3.5, GPT-4o, and DeepSeek V3
- **Real-time Market Data**: Fetches live prices from Yahoo Finance
- **Technical Analysis**: RSI, EMA, ATR, Support/Resistance calculations
- **Auto SL/TP**: Smart stop-loss and take-profit calculation
- **Telegram Bot**: Get signals directly in Telegram
- **Web Dashboard**: View signal history and statistics

## Supported Symbols

XAUUSD, EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, USDCHF, NZDUSD, GBPJPY, BTCUSD, ETHUSD, OIL

## Setup

### 1. Environment Variables

Add to your `.env` file:

```env
# Telegram Bot Token (get from @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# (Optional) AI API Keys for real AI analysis
KIMI_API_KEY=your_kimi_api_key
OPENROUTER_API_KEY=your_openrouter_key
```

### 2. Telegram Bot Setup

1. Message @BotFather on Telegram
2. Create new bot with `/newbot`
3. Copy the token to `TELEGRAM_BOT_TOKEN`
4. Set webhook URL (for production):
   ```
   https://your-domain/api/telegram/webhook
   ```

### 3. Commands

- `/start` - Welcome message
- `/signal SYMBOL` - Get trading signal
- `/stats` - View bot statistics
- `/help` - Show help

### 4. Web Dashboard

Access the dashboard at `http://localhost:3000`

## Architecture

```
User (Telegram) → /signal XAUUSD
    ↓
Bot fetches live market data (Yahoo Finance)
    ↓
4 AI Analysts vote independently:
  - Kimi K2 (long-context analysis)
  - Claude 3.5 (technical structure)
  - GPT-4o (multi-timeframe)
  - DeepSeek V3 (pattern recognition)
    ↓
Voting consensus → Signal with confidence score
    ↓
SL/TP calculated based on ATR + support/resistance
    ↓
Signal delivered to Telegram + saved to database
```

## Development

```bash
npm run dev      # Start development server
npm run check    # Type-check
npm run build    # Build for production
```

## Disclaimer

This system is for educational purposes only. Trading involves significant risk.
Always conduct your own research and use proper risk management.
