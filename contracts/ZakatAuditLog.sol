// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ZakatAuditLog
/// @notice Append-only, hash-linked audit log for workplace Zakat / payroll deduction events (demo).
/// @dev Companion to the Next.js app’s off-chain chain (`src/lib/audit-chain.ts`). The web app still uses
/// SHA-256 over JSON there; **this contract uses keccak256** packing suitable for EVM. To anchor off-chain
/// blocks on-chain, normalize payloads (e.g. UTF-8 JSON bytes) and pass the same `prevHash` / ordering rules
/// your indexer uses—or store periodic Merkle roots here instead of every row for gas savings.
contract ZakatAuditLog {
    struct AuditBlock {
        uint64 index;
        bytes32 prevHash;
        bytes32 blockHash;
        bytes payload;
    }

    AuditBlock[] private _blocks;
    address public registrar;

    error Unauthorized();
    error BadPrevHash(bytes32 expected, bytes32 provided);

    event AuditBlockAppended(uint64 indexed index, bytes32 prevHash, bytes32 blockHash, bytes payload);

    modifier onlyRegistrar() {
        if (msg.sender != registrar) revert Unauthorized();
        _;
    }

    constructor(address registrar_) {
        registrar = registrar_;
    }

    /// @notice Registers the next block. First call must pass `prevHash == bytes32(0)` (genesis link).
    /// @param prevHash Hash of the previous block; must match the chain tip (or zero when empty).
    /// @param payload Opaque payload (e.g. `abi.encode` or UTF-8 JSON bytes) committed into `blockHash`.
    /// @return index The zero-based index of the new block.
    function append(bytes32 prevHash, bytes calldata payload) external onlyRegistrar returns (uint64 index) {
        bytes32 expectedPrev = _blocks.length == 0 ? bytes32(0) : _blocks[_blocks.length - 1].blockHash;
        if (prevHash != expectedPrev) revert BadPrevHash(expectedPrev, prevHash);

        bytes32 blockHash = keccak256(abi.encodePacked(prevHash, keccak256(payload)));
        index = uint64(_blocks.length);
        _blocks.push(AuditBlock({ index: index, prevHash: prevHash, blockHash: blockHash, payload: payload }));
        emit AuditBlockAppended(index, prevHash, blockHash, payload);
    }

    function blockCount() external view returns (uint256) {
        return _blocks.length;
    }

    function getBlock(uint64 idx) external view returns (AuditBlock memory) {
        return _blocks[idx];
    }

    function transferRegistrar(address next) external onlyRegistrar {
        registrar = next;
    }
}
