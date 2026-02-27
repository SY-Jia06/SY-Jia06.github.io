# Java 集合框架全景图：List、Map、Set 一网打尽

> 学习日期：2026-02-27 | 标签：Java SE, 集合框架

## 一句话总结

Java 集合框架就是一套**管理一组对象**的标准化容器，核心三大接口：`List`（有序可重复）、`Set`（无序不重复）、`Map`（键值对）。

## 为什么需要它？

数组的痛点：
- **长度固定**，不能动态扩容
- **类型单一**，不能混存（泛型出现前）
- **操作原始**，增删改查全靠手写

集合框架解决了这些问题，提供了丰富的数据结构实现。

## 核心类图

```
Collection (接口)
├── List (有序，可重复)
│   ├── ArrayList   ← 底层数组，查快增删慢
│   ├── LinkedList  ← 底层双向链表，增删快查慢
│   └── Vector      ← 线程安全的 ArrayList（过时）
│
├── Set (无序，不重复)
│   ├── HashSet     ← 底层 HashMap
│   ├── LinkedHashSet ← 保持插入顺序
│   └── TreeSet     ← 有序，底层红黑树
│
└── Queue (队列)
    ├── LinkedList  ← 也实现了 Queue
    ├── PriorityQueue ← 优先队列，底层堆
    └── ArrayDeque  ← 双端队列

Map (接口，独立于 Collection)
├── HashMap        ← 数组+链表+红黑树（JDK8+）
├── LinkedHashMap  ← 保持插入/访问顺序
├── TreeMap        ← 有序，底层红黑树
├── Hashtable      ← 线程安全（过时）
└── ConcurrentHashMap ← 线程安全（推荐）
```

## HashMap 重点（面试必问）

### 底层结构

JDK 8 以后：**数组 + 链表 + 红黑树**

```java
// 简化的 HashMap 结构
Node<K,V>[] table;  // 主数组（桶）

static class Node<K,V> {
    final int hash;
    final K key;
    V value;
    Node<K,V> next;  // 链表的下一个节点
}
```

### 核心流程：put(key, value)

1. 计算 key 的 `hashCode()`，再通过扰动函数得到 hash
2. `hash & (n-1)` 算出数组下标（n 是数组长度）
3. 如果该位置为空，直接放入
4. 如果不为空（哈希冲突）：
   - 链表长度 < 8 → 尾插法加到链表
   - 链表长度 ≥ 8 且数组长度 ≥ 64 → **转红黑树**
5. 如果元素个数 > 容量 × 负载因子(0.75) → **扩容**（2倍）

### 为什么扩容是 2 倍？

因为 `hash & (n-1)` 要求 n 是 2 的幂，这样取模运算可以用位运算替代，效率更高。

## ArrayList vs LinkedList

| 特性 | ArrayList | LinkedList |
|------|-----------|------------|
| 底层 | 动态数组 | 双向链表 |
| 随机访问 | O(1) ✅ | O(n) ❌ |
| 头插/删 | O(n) ❌ | O(1) ✅ |
| 尾插 | 均摊 O(1) | O(1) |
| 内存 | 紧凑 | 每个节点额外指针 |
| 实际场景 | **大多数情况用这个** | 频繁头插删才考虑 |

> 💡 面试结论：**99% 的场景用 ArrayList**，LinkedList 的理论优势在实际中因为 CPU 缓存不友好而大打折扣。

## 面试怎么答？

### 30 秒版本
"Java 集合框架核心是 List、Set、Map 三大接口。List 用 ArrayList（数组）或 LinkedList（链表），Map 用 HashMap（数组+链表+红黑树），Set 底层就是 Map。HashMap 在 JDK8 引入了红黑树优化，链表长度超过 8 就转树，解决了哈希冲突导致的性能问题。"

### 追问：HashMap 线程安全吗？
"不安全。多线程环境用 `ConcurrentHashMap`，它在 JDK8 用了 CAS + synchronized 的细粒度锁，只锁单个桶，比 Hashtable 的全表锁性能好很多。"

## 我的理解

集合框架的设计哲学就是**接口与实现分离**——面向 `List` 接口编程，底层可以随时切换 `ArrayList` 或 `LinkedList`。这和 Spring 的 IoC 思想是一脉相承的，也和 Agent 系统中 Tool 接口的设计类似：定义统一的 Tool 接口，具体实现可以是搜索、计算、数据库查询等不同工具。
