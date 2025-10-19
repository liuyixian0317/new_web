import os 
from volcenginesdkarkruntime import Ark 
from volcenginesdkarkruntime.types.images.images import SequentialImageGenerationOptions

# 请确保您已将 API Key 存储在环境变量 ARK_API_KEY 中 
# 初始化Ark客户端，从环境变量中读取您的API Key 
client = Ark( 
    base_url="https://ark.cn-beijing.volces.com/api/v3", 
    api_key="17e900d2-979f-4cd1-8031-5c19ed387035", 
) 
 
imagesResponse = client.images.generate( 
    model="doubao-seedream-4-0-250828", 
    prompt="生成3张女孩和奶牛玩偶在游乐园开心地坐过山车的图片，涵盖早晨、中午、晚上",
    # image=[""],
    size="2K",
    sequential_image_generation="auto",
    sequential_image_generation_options=SequentialImageGenerationOptions(max_images=1),
    response_format="url",
    watermark=True
) 
 
# 遍历所有图片数据
for image in imagesResponse.data:
    # 输出当前图片的url和size
    print(f"URL: {image.url}, Size: {image.size}")
