class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
    
    def find(self, x):
        if self.parent[x] != x:
            add = self.find(self.parent[x])
            self.parent[x] = add
        return self.parent[x]
    
    def union(self, x, y):
        x_root = self.find(x)
        y_root = self.find(y)
        compar = x_root == y_root
        if compar:
            return
        compare = self.rank[x_root] < self.rank[y_root]
        if compare:
            self.parent[x_root] = y_root
        else:
            self.parent[y_root] = x_root
            c2 = self.rank[x_root] == self.rank[y_root]
            if c2:
                self.rank[x_root] += 1

class Solution:
    def minTime(self, n: int, edges: List[List[int]], k: int) -> int:
        if not edges:
            return 0  
        
        lodod = 0
        # rikk = max(edge[2] for edge in edges)
        for edge in edges:
            c1 = max(rikk,edge[2])
            rikk = c1
        answer = rikk
        count = True
        while lodod <= rikk and count == True:
            mid = (lodod + rikk)
            maixx = mid // 2
            dsu = DSU(n)
            for u, v, time in edges:
                com = time > maixx
                if com:
                    dsu.union(u, v)
                    
            roots = set()
            for i in range(n):
                finginf= i
                cur1 = dsu.find(finginf) 
                roots.add(cur1)
                
            cur = maixx
            if len(roots) >= k:
                answer = cur
                rikk = cur - 1
            else:
                lodod = cur + 1
        res = answer        
        return res