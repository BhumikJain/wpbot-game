# WhatsApp Bot for Card Game

A WhatsApp bot for automatically claiming cards in a card collecting game.

## Features

- Automatic card claiming based on tier and preferences
- Configurable claim probabilities
- Administrative commands for managing allowed numbers
- Random responses and stickers after claiming cards
- Logging system for debugging

## Setup

1. Install dependencies:

2. Configure the bot:
- Edit `config/allowedNumbers.js` to add your phone numbers
- Edit `config/preferredCardNames.js` to add your preferred card names
- Edit `config/randomTexts.js` to customize random responses
- Add stickers to the `assets/stickers` directory and update `config/randomStickers.js`

3. Start the bot:

4. Scan the QR code with WhatsApp to log in

## Commands

- `$opbot-col` - Send collection command
- `$opbot-add-number [number]` - Add number to allowed list
- `$opbot-remove-number [number]` - Remove number from allowed list
- `$opbot-list-numbers` - List all authorized numbers
- `$opbot-set-prob [category] [value]` - Configure claim chances
- `$opbot-get-probs` - Show current probability settings
- `$opbot-help` - Show the help menu

## Claim Probability Categories

- `preferred` - Probability for claiming preferred cards
- `tierS` - Probability for claiming tier S cards
- `tier4to6` - Probability for claiming tier 4-6 cards
- `tier1to3` - Probability for claiming tier 1-3 cards

## Example Configuration

```javascript
// Default probabilities:
{
"preferred": 1.0,  // 100% chance for preferred cards
"tierS": 0.8,      // 80% chance for tier S
"tier4to6": 0.8,   // 80% chance for tiers 4-6
"tier1to3": 0.45   // 45% chance for tiers 1-3
}