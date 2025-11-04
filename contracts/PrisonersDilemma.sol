// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, ebool} from "@fhevm/solidity/lib/FHE.sol";

contract PrisonersDilemma {
    enum Choice {
        Cooperate,
        Defect
    }

    enum ConditionSubject {
        RoundNumber,
        MyLastMove,
        OpponentLastMove,
        MyTotalDefects,
        OpponentTotalDefects,
        OpponentTotalCooperates
    }

    enum ConditionOperator {
        Is,
        IsNot,
        GreaterThan,
        LessThan,
        Equals
    }

    enum TournamentStatus {
        Registration,
        Countdown,
        Running,
        Finished
    }

    struct Rule {
        ConditionSubject subject;
        ConditionOperator operator;
        uint256 value;
        Choice action;
    }

    struct Strategy {
        Rule[] rules;
        Choice defaultAction;
        bool isSubmitted;
    }

    struct PlayerState {
        Choice lastMove;
        uint256 totalDefects;
        uint256 totalCooperates;
        uint256 score;
    }

    struct RoundData {
        Choice player1Move;
        Choice player2Move;
        uint256 player1Score;
        uint256 player2Score;
    }

    struct GameResult {
        address player1;
        address player2;
        uint256 player1TotalScore;
        uint256 player2TotalScore;
        address winner;
        uint256 totalRounds;
        uint256 timestamp;
    }

    struct TournamentInfo {
        uint256 tournamentId;
        TournamentStatus status;
        uint256 startTime;
        uint256 playerCount;
        uint256 totalGames;
        bool isFinished;
        uint256 rounds;
    }

    uint256 public constant DEFAULT_ROUNDS = 100;
    uint256 public constant MIN_ROUNDS = 10;
    uint256 public constant MAX_ROUNDS = 1000;
    uint256 public constant BOTH_COOPERATE_REWARD = 3;
    uint256 public constant DEFECT_VS_COOPERATE_REWARD = 5;
    uint256 public constant COOPERATE_VS_DEFECT_REWARD = 0;
    uint256 public constant BOTH_DEFECT_REWARD = 1;

    address public owner;
    mapping(address => bool) public authorizedStarters;
    
    mapping(address => Strategy) private strategies;
    mapping(uint256 => TournamentInfo) public tournaments;
    mapping(uint256 => mapping(uint256 => GameResult)) public tournamentGames;
    mapping(uint256 => mapping(uint256 => RoundData[])) public tournamentGameRounds;
    mapping(uint256 => mapping(address => uint256)) public tournamentPlayerScores;
    mapping(uint256 => address[]) public tournamentPlayers;
    mapping(uint256 => mapping(address => mapping(address => bool))) private hasPlayed;
    
    uint256 public currentTournamentId;
    TournamentInfo public currentTournament;
    uint256 public tournamentStartCountdown;

    event StrategySubmitted(address indexed player, uint256 tournamentId);
    event TournamentCreated(uint256 indexed tournamentId, uint256 startTime);
    event TournamentStarted(uint256 indexed tournamentId, uint256 playerCount, uint256 totalGames);
    event TournamentFinished(uint256 indexed tournamentId, address indexed winner, uint256 totalScore);
    event GameCompleted(uint256 indexed tournamentId, uint256 indexed gameId, address indexed winner, uint256 player1Score, uint256 player2Score);
    event CountdownUpdated(uint256 newCountdown);
    event AuthorizedStarterAdded(address indexed starter);
    event AuthorizedStarterRemoved(address indexed starter);
    event TournamentRoundsSet(uint256 indexed tournamentId, uint256 rounds);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedStarters[msg.sender], "Not authorized");
        _;
    }

    modifier onlyRegistration() {
        require(currentTournament.status == TournamentStatus.Registration, "Not in registration phase");
        _;
    }

    constructor() {
        owner = msg.sender;
        currentTournamentId = 0;
        tournamentStartCountdown = 0;
        currentTournament = TournamentInfo({
            tournamentId: 0,
            status: TournamentStatus.Registration,
            startTime: 0,
            playerCount: 0,
            totalGames: 0,
            isFinished: false,
            rounds: DEFAULT_ROUNDS
        });
    }

    function addAuthorizedStarter(address starter) external onlyOwner {
        require(starter != address(0), "Invalid address");
        authorizedStarters[starter] = true;
        emit AuthorizedStarterAdded(starter);
    }

    function removeAuthorizedStarter(address starter) external onlyOwner {
        authorizedStarters[starter] = false;
        emit AuthorizedStarterRemoved(starter);
    }

    function setTournamentCountdown(uint256 countdown) external onlyAuthorized {
        require(currentTournament.status == TournamentStatus.Registration, "Not in registration");
        tournamentStartCountdown = block.timestamp + countdown;
        currentTournament.status = TournamentStatus.Countdown;
        emit CountdownUpdated(tournamentStartCountdown);
    }

    function submitStrategy(Rule[] memory _rules, Choice _defaultAction) external onlyRegistration {
        require(_rules.length <= 20, "Too many rules (max 20)");
        require(!strategies[msg.sender].isSubmitted, "Strategy already submitted");
        
        for (uint256 i = 0; i < _rules.length; i++) {
            _validateRule(_rules[i]);
        }

        delete strategies[msg.sender].rules;

        Strategy storage strategy = strategies[msg.sender];
        strategy.defaultAction = _defaultAction;
        strategy.isSubmitted = true;

        for (uint256 i = 0; i < _rules.length; i++) {
            strategy.rules.push(_rules[i]);
        }

        tournamentPlayers[currentTournamentId].push(msg.sender);
        currentTournament.playerCount++;

        emit StrategySubmitted(msg.sender, currentTournamentId);
    }

    function setTournamentRounds(uint256 rounds) external onlyAuthorized onlyRegistration {
        require(rounds >= MIN_ROUNDS && rounds <= MAX_ROUNDS, "Invalid rounds");
        currentTournament.rounds = rounds;
        emit TournamentRoundsSet(currentTournamentId, rounds);
    }

    function startTournament() external onlyAuthorized {
        require(
            currentTournament.status == TournamentStatus.Registration || 
            currentTournament.status == TournamentStatus.Countdown,
            "Invalid status"
        );
        
        if (currentTournament.status == TournamentStatus.Countdown) {
            require(block.timestamp >= tournamentStartCountdown, "Countdown not finished");
        }

        require(currentTournament.playerCount >= 2, "Need at least 2 players");

        currentTournament.status = TournamentStatus.Running;
        currentTournament.startTime = block.timestamp;

        emit TournamentStarted(currentTournamentId, currentTournament.playerCount, 0);

        _runTournament();
    }

    function forceStartTournament() external onlyAuthorized {
        require(currentTournament.status != TournamentStatus.Running, "Already running");
        require(currentTournament.playerCount >= 2, "Need at least 2 players");

        currentTournament.status = TournamentStatus.Running;
        currentTournament.startTime = block.timestamp;

        emit TournamentStarted(currentTournamentId, currentTournament.playerCount, 0);

        _runTournament();
    }

    function getTournamentInfo() external view returns (TournamentInfo memory) {
        return currentTournament;
    }

    function getTournament(uint256 tournamentId) external view returns (TournamentInfo memory) {
        if (tournamentId == currentTournamentId) {
            return currentTournament;
        }
        return tournaments[tournamentId];
    }

    function getTournamentPlayers(uint256 tournamentId) external view returns (address[] memory) {
        return tournamentPlayers[tournamentId];
    }

    function getPlayerScore(uint256 tournamentId, address player) external view returns (uint256) {
        return tournamentPlayerScores[tournamentId][player];
    }

    function getTournamentGame(uint256 tournamentId, uint256 gameId) external view returns (GameResult memory) {
        return tournamentGames[tournamentId][gameId];
    }

    function getTournamentGameRounds(uint256 tournamentId, uint256 gameId) external view returns (RoundData[] memory) {
        return tournamentGameRounds[tournamentId][gameId];
    }

    function getStrategy(address player) external view returns (Rule[] memory rules, Choice defaultAction, bool isSubmitted) {
        Strategy storage strategy = strategies[player];
        return (strategy.rules, strategy.defaultAction, strategy.isSubmitted);
    }

    function _runTournament() private {
        address[] memory players = tournamentPlayers[currentTournamentId];
        uint256 playersLength = players.length;
        uint256 gameId = 0;
        uint256 tournamentId = currentTournamentId;

        unchecked {
            for (uint256 i = 0; i < playersLength; ++i) {
                for (uint256 j = i + 1; j < playersLength; ++j) {
                    address player1 = players[i];
                    address player2 = players[j];

                    if (!hasPlayed[tournamentId][player1][player2]) {
                        _simulateGame(tournamentId, gameId, player1, player2);
                        hasPlayed[tournamentId][player1][player2] = true;
                        hasPlayed[tournamentId][player2][player1] = true;
                        ++gameId;
                    }
                }
            }
        }

        currentTournament.totalGames = gameId;
        currentTournament.isFinished = true;
        currentTournament.status = TournamentStatus.Finished;

        tournaments[currentTournamentId] = currentTournament;

        address winner = _determineWinner();
        uint256 winnerScore = tournamentPlayerScores[currentTournamentId][winner];

        emit TournamentFinished(currentTournamentId, winner, winnerScore);

        _prepareNextTournament();
    }

    function _simulateGame(uint256 tournamentId, uint256 gameId, address player1, address player2) private {
        TournamentInfo memory tournamentInfo = tournamentId == currentTournamentId ? currentTournament : tournaments[tournamentId];
        uint256 rounds = tournamentInfo.rounds;
        
        GameResult storage game = tournamentGames[tournamentId][gameId];
        game.player1 = player1;
        game.player2 = player2;
        game.totalRounds = rounds;
        game.timestamp = block.timestamp;
        
        PlayerState memory state1 = PlayerState({
            lastMove: Choice.Cooperate,
            totalDefects: 0,
            totalCooperates: 0,
            score: 0
        });

        PlayerState memory state2 = PlayerState({
            lastMove: Choice.Cooperate,
            totalDefects: 0,
            totalCooperates: 0,
            score: 0
        });

        unchecked {
            for (uint256 round = 1; round <= rounds; ++round) {
                Choice move1 = _determineMove(player1, round, state1, state2);
                Choice move2 = _determineMove(player2, round, state2, state1);

                (uint256 score1, uint256 score2) = _calculateRoundScores(move1, move2);

                state1.lastMove = move1;
                state2.lastMove = move2;
                state1.score += score1;
                state2.score += score2;

                if (move1 == Choice.Defect) {
                    ++state1.totalDefects;
                } else {
                    ++state1.totalCooperates;
                }

                if (move2 == Choice.Defect) {
                    ++state2.totalDefects;
                } else {
                    ++state2.totalCooperates;
                }

                tournamentGameRounds[tournamentId][gameId].push(RoundData({
                    player1Move: move1,
                    player2Move: move2,
                    player1Score: score1,
                    player2Score: score2
                }));
            }
        }

        game.player1TotalScore = state1.score;
        game.player2TotalScore = state2.score;
        
        tournamentPlayerScores[tournamentId][player1] += state1.score;
        tournamentPlayerScores[tournamentId][player2] += state2.score;

        if (state1.score > state2.score) {
            game.winner = player1;
        } else if (state2.score > state1.score) {
            game.winner = player2;
        } else {
            game.winner = address(0);
        }

        emit GameCompleted(tournamentId, gameId, game.winner, state1.score, state2.score);
    }

    function _determineMove(address player, uint256 roundNumber, PlayerState memory myState, PlayerState memory opponentState) private view returns (Choice) {
        Strategy storage strategy = strategies[player];
        uint256 rulesLength = strategy.rules.length;

        unchecked {
            for (uint256 i = 0; i < rulesLength; ++i) {
                Rule storage rule = strategy.rules[i];
                
                if (_evaluateCondition(rule, roundNumber, myState, opponentState)) {
                    return rule.action;
                }
            }
        }

        return strategy.defaultAction;
    }

    function _evaluateCondition(Rule storage rule, uint256 roundNumber, PlayerState memory myState, PlayerState memory opponentState) private view returns (bool isTrue) {
        uint256 actualValue;

        if (rule.subject == ConditionSubject.RoundNumber) {
            actualValue = roundNumber;
        } else if (rule.subject == ConditionSubject.MyLastMove) {
            actualValue = uint256(myState.lastMove);
        } else if (rule.subject == ConditionSubject.OpponentLastMove) {
            actualValue = uint256(opponentState.lastMove);
        } else if (rule.subject == ConditionSubject.MyTotalDefects) {
            actualValue = myState.totalDefects;
        } else if (rule.subject == ConditionSubject.OpponentTotalDefects) {
            actualValue = opponentState.totalDefects;
        } else if (rule.subject == ConditionSubject.OpponentTotalCooperates) {
            actualValue = opponentState.totalCooperates;
        }

        if (rule.operator == ConditionOperator.Equals || rule.operator == ConditionOperator.Is) {
            return actualValue == rule.value;
        } else if (rule.operator == ConditionOperator.IsNot) {
            return actualValue != rule.value;
        } else if (rule.operator == ConditionOperator.GreaterThan) {
            return actualValue > rule.value;
        } else if (rule.operator == ConditionOperator.LessThan) {
            return actualValue < rule.value;
        }

        return false;
    }

    function _calculateRoundScores(Choice move1, Choice move2) private pure returns (uint256 score1, uint256 score2) {
        if (move1 == Choice.Cooperate && move2 == Choice.Cooperate) {
            return (BOTH_COOPERATE_REWARD, BOTH_COOPERATE_REWARD);
        } else if (move1 == Choice.Cooperate && move2 == Choice.Defect) {
            return (COOPERATE_VS_DEFECT_REWARD, DEFECT_VS_COOPERATE_REWARD);
        } else if (move1 == Choice.Defect && move2 == Choice.Cooperate) {
            return (DEFECT_VS_COOPERATE_REWARD, COOPERATE_VS_DEFECT_REWARD);
        } else {
            return (BOTH_DEFECT_REWARD, BOTH_DEFECT_REWARD);
        }
    }

    function _validateRule(Rule memory rule) private pure {
        if (rule.subject == ConditionSubject.MyLastMove || rule.subject == ConditionSubject.OpponentLastMove) {
            require(rule.operator == ConditionOperator.Is || rule.operator == ConditionOperator.IsNot, "Invalid operator for move subject");
            require(rule.value <= 1, "Invalid value for Choice (0=Cooperate, 1=Defect)");
        } else {
            require(rule.operator == ConditionOperator.Equals || rule.operator == ConditionOperator.GreaterThan || rule.operator == ConditionOperator.LessThan, "Invalid operator for numeric subject");
        }
    }

    function _determineWinner() private view returns (address winner) {
        address[] memory players = tournamentPlayers[currentTournamentId];
        uint256 playersLength = players.length;
        uint256 maxScore = 0;
        address topPlayer = address(0);
        uint256 tournamentId = currentTournamentId;

        unchecked {
            for (uint256 i = 0; i < playersLength; ++i) {
                uint256 playerScore = tournamentPlayerScores[tournamentId][players[i]];
                if (playerScore > maxScore) {
                    maxScore = playerScore;
                    topPlayer = players[i];
                }
            }
        }

        return topPlayer;
    }

    function _prepareNextTournament() private {
        unchecked {
            ++currentTournamentId;
        }
        
        currentTournament = TournamentInfo({
            tournamentId: currentTournamentId,
            status: TournamentStatus.Registration,
            startTime: 0,
            playerCount: 0,
            totalGames: 0,
            isFinished: false,
            rounds: DEFAULT_ROUNDS
        });

        tournamentStartCountdown = 0;

        emit TournamentCreated(currentTournamentId, 0);
    }
}
