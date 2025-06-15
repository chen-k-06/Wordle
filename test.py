import pickle
import msgpack

# Load your pickle file
with open("pattern_cache.pkl", "rb") as f:
    data = pickle.load(f)

def convert_sets(obj):
    if isinstance(obj, set):
        return list(obj)
    elif isinstance(obj, dict):
        return {k: convert_sets(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_sets(i) for i in obj]
    else:
        return obj
    
data_serializable = convert_sets(data)
    
# Save as MessagePack binary
with open("pattern_cache.msgpack", "wb") as f:
    f.write(msgpack.packb(data_serializable))
