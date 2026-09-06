import { getSeneca } from '../../env/lambda/lambda'

function complete(seneca: any) {
  seneca.listen({type:'sqs',pin:'sys:chat,cmd:ask'})
  seneca.listen({type:'sqs',pin:'sys:chat,user:o\'brien'})
  seneca.client({type:'sqs',pin:'sys:search'})
}

exports.handler = async (
  event:any,
  context:any
) => {
  
  let seneca = await getSeneca('chat', complete)
  
  let handler = seneca.export('gateway-lambda/handler')
  let res = await handler(event, context)
  return res
}
