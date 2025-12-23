// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import FHEVM library
import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

// Import encrypted types
import "encrypted-types/EncryptedTypes.sol";

/**
 * @title PrisonersDilemma
 * @notice A Prisoner's Dilemma tournament game with FHE-encrypted strategies
 * @dev Uses Zama's FHEVM for fully homomorphic encryption of player strategies
 */
contract PrisonersDilemma is ZamaEthereumConfig {
    // ============ Enums ============
    
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
        PendingComputation,
        ResultsPublished,
        Finished
    }

    // ============ Structs ============

    struct Rule {
        ConditionSubject subject;
        ConditionOperator operator;
        uint256 value;
    }

    struct EncryptedStrategy {
        Rule[] rules;
        euint128 encryptedActions; // FHE encrypted actions
        bool isSubmitted;
    }

    struct TournamentInfo {
        uint256 tournamentId;
        TournamentStatus status;
        uint256 startTime;
        uint256 playerCount;
        uint256 totalGames;
        uint256 rounds;
        uint256 prizePool;
    }

    struct VoteInfo {
        uint256 voteCount;
        mapping(address => bool) hasVoted;
        uint256 requiredVotes;
    }

    struct PublishedResults {
        mapping(address => uint256) scores;
        address[] winners;
        uint256[] prizes;
        bool isPublished;
    }

    // ============ Constants ============

    uint256 public constant DEFAULT_ROUNDS = 50;
    uint256 public constant MIN_ROUNDS = 10;
    uint256 public constant MAX_ROUNDS = 200;
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant WINNER_PERCENTAGE = 30;
    uint256 public constant VOTE_QUORUM = 50;
    uint256 public constant MAX_RULES = 10;

    // ============ State Variables ============

    address public owner;
    address public computationOracle;

    mapping(uint256 => mapping(address => EncryptedStrategy)) private encryptedStrategies;
    mapping(uint256 => TournamentInfo) public tournaments;
    mapping(uint256 => address[]) public tournamentPlayers;
    mapping(uint256 => VoteInfo) private tournamentVotes;
    mapping(uint256 => PublishedResults) private tournamentResults;

    uint256 public currentTournamentId;
    TournamentInfo public currentTournament;

    // ============ Events ============

    event StrategySubmitted(address indexed player, uint256 tournamentId);
    event TournamentCreated(uint256 indexed tournamentId);
    event VoteCast(uint256 indexed tournamentId, address indexed voter, uint256 currentVotes, uint256 requiredVotes);
    event TournamentStarted(uint256 indexed tournamentId, uint256 playerCount);
    event ResultsPublished(uint256 indexed tournamentId, address[] winners, uint256[] prizes);
    event TournamentFinished(uint256 indexed tournamentId);
    event ComputationOracleSet(address indexed oracle);
    event TournamentRoundsSet(uint256 indexed tournamentId, uint256 rounds);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == computationOracle || msg.sender == owner, "Only oracle");
        _;
    }

    modifier onlyRegistration() {
        require(currentTournament.status == TournamentStatus.Registration, "Not in registration");
        _;
    }

    // ============ Constructor ============

    constructor() {
        owner = msg.sender;
        computationOracle = msg.sender;
        currentTournamentId = 0;
        currentTournament = TournamentInfo({
            tournamentId: 0,
            status: TournamentStatus.Registration,
            startTime: 0,
            playerCount: 0,
            totalGames: 0,
            rounds: DEFAULT_ROUNDS,
            prizePool: 0
        });
    }

    // ============ Admin Functions ============

    function setComputationOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "Invalid oracle");
        computationOracle = oracle;
        emit ComputationOracleSet(oracle);
    }

    function setTournamentRounds(uint256 rounds) external onlyOwner onlyRegistration {
        require(rounds >= MIN_ROUNDS && rounds <= MAX_ROUNDS, "Invalid rounds");
        currentTournament.rounds = rounds;
        emit TournamentRoundsSet(currentTournamentId, rounds);
    }

    function forceStartTournament() external onlyOwner {
        _startTournament();
    }

    // ============ Player Functions ============

    /**
     * @notice Submit an encrypted strategy to the tournament
     * @param encryptedActionsHandle The FHE-encrypted actions (external handle from relayer)
     * @param inputProof The ZKPoK proof for the encrypted input
     * @param subjects Array of condition subjects for each rule
     * @param operators Array of condition operators for each rule
     * @param values Array of condition values for each rule
     */
    function submitStrategy(
        externalEuint128 encryptedActionsHandle,
        bytes calldata inputProof,
        ConditionSubject[] calldata subjects,
        ConditionOperator[] calldata operators,
        uint256[] calldata values
    ) external payable onlyRegistration {
        require(msg.value >= ENTRY_FEE, "Insufficient entry fee");
        require(subjects.length == operators.length && operators.length == values.length, "Mismatched arrays");
        require(subjects.length <= MAX_RULES, "Too many rules");
        require(!encryptedStrategies[currentTournamentId][msg.sender].isSubmitted, "Strategy already submitted");

        // Delete any existing rules
        delete encryptedStrategies[currentTournamentId][msg.sender].rules;

        EncryptedStrategy storage strategy = encryptedStrategies[currentTournamentId][msg.sender];
        strategy.isSubmitted = true;

        // Convert external handle to euint128 using FHE.fromExternal
        // This validates the ZKPoK proof and registers the ciphertext
        euint128 encryptedActions = FHE.fromExternal(encryptedActionsHandle, inputProof);
        
        // Allow this contract to use the encrypted value in future transactions
        FHE.allowThis(encryptedActions);
        
        // Allow the player to access their own encrypted strategy for user decryption
        FHE.allow(encryptedActions, msg.sender);
        
        // Allow the oracle to access for computation
        FHE.allow(encryptedActions, computationOracle);
        
        // Store the encrypted value
        strategy.encryptedActions = encryptedActions;

        // Store and validate rules
        for (uint256 i = 0; i < subjects.length; i++) {
            _validateRuleStructure(subjects[i], operators[i]);
            strategy.rules.push(Rule({subject: subjects[i], operator: operators[i], value: values[i]}));
        }

        // Update tournament state
        tournamentPlayers[currentTournamentId].push(msg.sender);
        currentTournament.playerCount++;
        currentTournament.prizePool += msg.value;

        // Update vote requirements
        VoteInfo storage votes = tournamentVotes[currentTournamentId];
        votes.requiredVotes = (currentTournament.playerCount * VOTE_QUORUM) / 100;
        if (votes.requiredVotes < 2) votes.requiredVotes = 2;

        emit StrategySubmitted(msg.sender, currentTournamentId);
    }

    /**
     * @notice Vote to start the tournament
     * @dev Requires the player to have submitted a strategy
     */
    function voteStartTournament() external {
        require(currentTournament.status == TournamentStatus.Registration, "Not in registration");
        require(encryptedStrategies[currentTournamentId][msg.sender].isSubmitted, "Must submit strategy to vote");

        VoteInfo storage votes = tournamentVotes[currentTournamentId];
        require(!votes.hasVoted[msg.sender], "Already voted");

        votes.hasVoted[msg.sender] = true;
        votes.voteCount++;

        emit VoteCast(currentTournamentId, msg.sender, votes.voteCount, votes.requiredVotes);

        if (votes.voteCount >= votes.requiredVotes) {
            _startTournament();
        }
    }

    // ============ Oracle Functions ============

    /**
     * @notice Publish tournament results (called by oracle after off-chain computation)
     * @param tournamentId The tournament ID
     * @param players Array of player addresses
     * @param scores Array of scores for each player
     * @param winners Array of winner addresses
     * @param prizes Array of prizes for each winner
     */
    function publishResults(
        uint256 tournamentId,
        address[] calldata players,
        uint256[] calldata scores,
        address[] calldata winners,
        uint256[] calldata prizes
    ) external onlyOracle {
        require(tournamentId == currentTournamentId, "Invalid tournament");
        require(currentTournament.status == TournamentStatus.PendingComputation, "Not pending");
        require(players.length == scores.length, "Mismatched arrays");
        require(winners.length == prizes.length, "Mismatched prizes");

        PublishedResults storage results = tournamentResults[tournamentId];
        require(!results.isPublished, "Already published");

        for (uint256 i = 0; i < players.length; i++) {
            results.scores[players[i]] = scores[i];
        }

        results.winners = winners;
        results.prizes = prizes;
        results.isPublished = true;

        currentTournament.status = TournamentStatus.ResultsPublished;

        emit ResultsPublished(tournamentId, winners, prizes);

        _distributePrizes(tournamentId);
    }

    // ============ View Functions ============

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
        require(tournamentResults[tournamentId].isPublished, "Results not published yet");
        return tournamentResults[tournamentId].scores[player];
    }

    function getTournamentWinners(uint256 tournamentId) external view returns (address[] memory, uint256[] memory) {
        require(tournamentResults[tournamentId].isPublished, "Results not published yet");
        PublishedResults storage results = tournamentResults[tournamentId];
        return (results.winners, results.prizes);
    }

    function getVoteInfo(uint256 tournamentId) external view returns (uint256 voteCount, uint256 requiredVotes) {
        VoteInfo storage votes = tournamentVotes[tournamentId];
        return (votes.voteCount, votes.requiredVotes);
    }

    function hasVoted(uint256 tournamentId, address player) external view returns (bool) {
        return tournamentVotes[tournamentId].hasVoted[player];
    }

    /**
     * @notice Get the strategy rules for a player (non-encrypted parts)
     * @param player The player address
     * @return subjects Array of condition subjects
     * @return operators Array of condition operators
     * @return values Array of condition values
     * @return isSubmitted Whether the strategy has been submitted
     */
    function getStrategy(
        address player
    )
        external
        view
        returns (
            ConditionSubject[] memory subjects,
            ConditionOperator[] memory operators,
            uint256[] memory values,
            bool isSubmitted
        )
    {
        EncryptedStrategy storage strategy = encryptedStrategies[currentTournamentId][player];
        uint256 rulesLength = strategy.rules.length;

        subjects = new ConditionSubject[](rulesLength);
        operators = new ConditionOperator[](rulesLength);
        values = new uint256[](rulesLength);

        for (uint256 i = 0; i < rulesLength; i++) {
            Rule storage rule = strategy.rules[i];
            subjects[i] = rule.subject;
            operators[i] = rule.operator;
            values[i] = rule.value;
        }

        isSubmitted = strategy.isSubmitted;
    }

    /**
     * @notice Get the encrypted strategy handle for a player (for user decryption)
     * @dev Only the player themselves can access this (ACL enforced)
     * @param player The player address
     * @return encryptedActionsHandle The encrypted actions handle as bytes32
     */
    function getEncryptedActionsHandle(address player) external view returns (bytes32) {
        require(
            msg.sender == player || msg.sender == computationOracle || msg.sender == owner,
            "Not authorized"
        );
        EncryptedStrategy storage strategy = encryptedStrategies[currentTournamentId][player];
        require(strategy.isSubmitted, "No strategy submitted");
        return FHE.toBytes32(strategy.encryptedActions);
    }

    /**
     * @notice Get the full encrypted strategy for computation (oracle only)
     * @param player The player address
     * @return encryptedActionsHandle The encrypted actions handle
     * @return subjects Array of condition subjects
     * @return operators Array of condition operators
     * @return values Array of condition values
     */
    function getEncryptedStrategyForComputation(
        address player
    )
        external
        view
        onlyOracle
        returns (
            bytes32 encryptedActionsHandle,
            ConditionSubject[] memory subjects,
            ConditionOperator[] memory operators,
            uint256[] memory values
        )
    {
        EncryptedStrategy storage strategy = encryptedStrategies[currentTournamentId][player];
        require(strategy.isSubmitted, "No strategy submitted");

        uint256 rulesLength = strategy.rules.length;
        subjects = new ConditionSubject[](rulesLength);
        operators = new ConditionOperator[](rulesLength);
        values = new uint256[](rulesLength);

        for (uint256 i = 0; i < rulesLength; i++) {
            subjects[i] = strategy.rules[i].subject;
            operators[i] = strategy.rules[i].operator;
            values[i] = strategy.rules[i].value;
        }

        encryptedActionsHandle = FHE.toBytes32(strategy.encryptedActions);
    }

    // ============ Internal Functions ============

    function _startTournament() private {
        require(currentTournament.status == TournamentStatus.Registration, "Invalid status");
        require(currentTournament.playerCount >= 2, "Need at least 2 players");

        currentTournament.status = TournamentStatus.PendingComputation;
        currentTournament.startTime = block.timestamp;

        uint256 n = currentTournament.playerCount;
        currentTournament.totalGames = (n * (n - 1)) / 2;

        emit TournamentStarted(currentTournamentId, currentTournament.playerCount);
    }

    function _distributePrizes(uint256 tournamentId) private {
        PublishedResults storage results = tournamentResults[tournamentId];

        for (uint256 i = 0; i < results.winners.length; i++) {
            payable(results.winners[i]).transfer(results.prizes[i]);
        }

        currentTournament.status = TournamentStatus.Finished;
        tournaments[tournamentId] = currentTournament;

        emit TournamentFinished(tournamentId);

        _prepareNextTournament();
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
            rounds: DEFAULT_ROUNDS,
            prizePool: 0
        });

        emit TournamentCreated(currentTournamentId);
    }

    function _validateRuleStructure(ConditionSubject subject, ConditionOperator operator) private pure {
        if (subject == ConditionSubject.MyLastMove || subject == ConditionSubject.OpponentLastMove) {
            require(
                operator == ConditionOperator.Is || operator == ConditionOperator.IsNot,
                "Invalid operator for move subject"
            );
        } else {
            require(
                operator == ConditionOperator.Equals ||
                    operator == ConditionOperator.GreaterThan ||
                    operator == ConditionOperator.LessThan,
                "Invalid operator for numeric subject"
            );
        }
    }

    // ============ Fallback ============

    receive() external payable {}
}
